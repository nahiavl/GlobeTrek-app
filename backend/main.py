import json
from fastapi import FastAPI, Depends, APIRouter, HTTPException, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
from crud.security import PWD_CONTEXT
from config import settings, Settings
from functools import lru_cache
from typing import Any, List
from google_auth_oauthlib.flow import Flow
from crud.crud_user import user
from db.db import User
from fastapi.responses import JSONResponse, RedirectResponse
import httpx
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from auth_token import authenticate, create_access_token, get_current_user, get_db
from api import deps
from fastapi.middleware.cors import CORSMiddleware

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

app = FastAPI(title="GlobeTrek", openapi_url="/openapi.json")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.front_baseUrl],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@lru_cache
def get_settings():
    return Settings()

api_router = APIRouter()

class UserCreate(BaseModel):
    name: str
    birthday: Optional[str] = None
    email: str
    password: Optional[str] = None
    countries: Optional[List[str]] = None


class UserCredentials(BaseModel):
    username: str
    password: str

def get_google_oauth_flow():

    data = {"web":
        {
            "client_id": settings.client_id,
            "project_id": settings.project_id,
            "auth_uri":"https://accounts.google.com/o/oauth2/auth",
            "token_uri":"https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": settings.client_secret,
            "redirect_uris":[f'{settings.back_baseUrl}/oauth/callback'],
            "javascript_origins":[f'{settings.back_baseUrl}',f'{settings.front_baseUrl}']
            }
        }
    
    with open('client_secret.json', 'w') as f:
        json.dump(data, f)
        
    return Flow.from_client_secrets_file(
        './client_secret.json',
        scopes=[
            'openid', 
            'https://www.googleapis.com/auth/userinfo.email', 
            'https://www.googleapis.com/auth/userinfo.profile'
        ],
        redirect_uri=f'{settings.back_baseUrl}/oauth/callback'
    )

@app.post("/signup", response_model=dict, tags=["Auth"])
def create_user_signup(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    existing_user = user.get_by_email(db=db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    
    new_user = user.create(db=db, obj_in=user_in)
    return {
        "id": new_user.id,
        "name": new_user.name,
        "birthday": new_user.birthday,
        "email": new_user.email,
        "countries": new_user.countries
    }

@app.post("/login", tags=["Auth"], response_model=dict)
async def login(
    user: UserCredentials,
    db: Session = Depends(get_db),
):
    user_obj = authenticate(email=user.username, password=user.password, db=db)
    if not user_obj:
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    access_token = create_access_token(sub=user_obj.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user_obj.id
    }
 
@app.get("/api/login", tags=["Auth"])
async def login():
    flow = get_google_oauth_flow()
    authorization_url, _ = flow.authorization_url(prompt='consent')
    return RedirectResponse(url=authorization_url)

@app.get("/oauth/callback", tags=["Auth"])
async def oauth_callback(code: str, db: Session = Depends(get_db)):
    flow = get_google_oauth_flow()
    try:
        flow.fetch_token(code=code)
        credentials = flow.credentials
    except Exception as e:
        return JSONResponse(content={"error": "Token exchange failed", "details": str(e)}, status_code=400)

    async with httpx.AsyncClient() as client:
        headers = {'Authorization': f'Bearer {credentials.token}'}
        user_info_response = await client.get(
            'https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses',
            headers=headers
        )
        
    if user_info_response.status_code != 200:
        error_details = await user_info_response.json()
        return JSONResponse(content={
            "error": "Failed to retrieve user information from Google",
            "details": error_details
        }, status_code=400)
        
    user_info = user_info_response.json()
    name = user_info.get('names', [{}])[0].get('displayName', 'No name found')
    email = user_info.get('emailAddresses', [{}])[0].get('value', 'No email found')
    birthday = None

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        token = create_access_token(sub=existing_user.id)
        return RedirectResponse(url=f"{settings.front_baseUrl}/Globetrek/en/home?token={token}&id={existing_user.id}")
    else:
        new_user = User(name=name, birthday=birthday, email=email, password=None, countries=[])
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        token = create_access_token(sub=new_user.id)
        return RedirectResponse(url=f"{settings.front_baseUrl}/Globetrek/en/new_password?token={token}&id={new_user.id}")
    
@api_router.get("/user/{user_id}", response_model=dict, status_code=200, tags=["Users"])
def fetch_user(
    user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):    
    if user_id != current_user.id:
        raise HTTPException(
            status_code=401,
            detail="Not authorized"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"id": user.id, "name": user.name, "countries": user.countries, "email": user.email, "birthday": user.birthday}

@api_router.delete("/user/{user_id}", status_code=200, tags=["Users"])
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        user_to_delete = db.query(User).filter(User.id == user_id).first()
        if user_to_delete is None:
            raise HTTPException(status_code=404, detail="User not found")
        if user_id != current_user.id:
            raise HTTPException(
                status_code=401,
                detail="Not authorized"
            )
        db.delete(user_to_delete)
        db.commit()
        return {"detail": "User deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@api_router.patch("/user/{user_id}", status_code=200, tags=["Users"])
def modify_user(user_id: int, user_update: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")

        if user_id != current_user.id:
            raise HTTPException(
                status_code=401,
                detail="Not authorized"
            )

        if user_update.name is not None:
            user.name = user_update.name
        if user_update.birthday is not None:
            user.birthday = user_update.birthday
        if user_update.email is not None:
            user.email = user_update.email
        if user_update.countries is not None:
            user.countries = user_update.countries
        if user_update.password is not None:
            hashed_password = PWD_CONTEXT.hash(user_update.password)
            user.password = hashed_password
            
        db.commit()

        return {
            "id": user.id,
            "name": user.name,
            "birthday": user.birthday,
            "email": user.email,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

app.include_router(api_router)
from datetime import time
import json
from fastapi import Depends, HTTPException, FastAPI, APIRouter, Response
from typing import List, Optional
from httpx import AsyncClient
import os
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext

load_dotenv()

app = FastAPI(title="Gateway to API", openapi_url="/openapi.json")
api_router = APIRouter()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
BACK_BASE_URL = os.getenv('BACK_BASE_URL')
API_BASE_URL = os.getenv('API_BASE_URL')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/login")
    
class UserModel(BaseModel):
    name: str
    birthday: str
    password: str
    email: str
    countries: List[str]

class UserCredentials(BaseModel):
    username: str
    password: str

class PlaceDescription(BaseModel):
    place: str
    description: str
    tips: str
    checked: str
       
class ItineraryDay(BaseModel):
    day: str
    description: List[PlaceDescription]
class ItineraryResponse(BaseModel):
    destination: str
    startDate: str
    endDate: str
    state: str
    owner: str
    country: str
    city: str
    itinerary: List[ItineraryDay]
    stars: Optional[int]

class PersonalizedItinerary(BaseModel):
    prompt: str
 
class ItineraryListResponse(BaseModel):
    itineraries: List[ItineraryResponse]
    
class TokenData(BaseModel):
    username: Optional[str] = None

def decode_jwt(token: str) -> dict:
    try:
        decoded_token = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return decoded_token if decoded_token["expires"] >= time.time() else None
    except:
        return {}
                  
@api_router.get("/api/login", tags=["Auth"])
async def login():
    async with AsyncClient(follow_redirects=False) as client:
        try:
            response = await client.get(f"{BACK_BASE_URL}/api/login")
            if response.status_code in (307, 302):
                return JSONResponse({"redirect_url": response.headers["location"]})
            return response.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error calling backend login API: {e}")

@api_router.post("/signup", response_model=dict, status_code=200, tags=["Auth"])
async def create_user(user: UserModel):
    async with AsyncClient() as client:
        response = await client.post(f"{BACK_BASE_URL}/signup", json=jsonable_encoder(user))
        return response.json()

@api_router.post("/login", response_model=dict, status_code=200, tags=["Auth"])
async def create_user(user: UserCredentials):
    async with AsyncClient() as client:
        response = await client.post(
            f"{BACK_BASE_URL}/login",
            json=jsonable_encoder(user)
        )
        return response.json()

@api_router.get("/user/{user_id}", response_model=dict, tags=["Users"])
async def fetch_user(user_id: int, token: str = Depends(oauth2_scheme)):
    async with AsyncClient() as client:
        response = await client.get(f"{BACK_BASE_URL}/user/{user_id}", headers={"Authorization": f"Bearer {token}"})
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code, 
                detail=response.json().get("detail", "Error from backend")
            )
        return response.json()

@api_router.patch("/user/{user_id}", response_model=dict, tags=["Users"])
async def modify_user(user_id: int, user_update: dict, token: str = Depends(oauth2_scheme)):
    async with AsyncClient() as client:
        response = await client.patch(f"{BACK_BASE_URL}/user/{user_id}", json=user_update, headers={"Authorization": f"Bearer {token}"})
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code, 
                detail=response.json().get("detail", "Error from backend")
            )
        return response.json()

@api_router.delete("/user/{user_id}", tags=["Users"])
async def delete_user(user_id: int, token: str = Depends(oauth2_scheme)):
    async with AsyncClient() as client:
        response = await client.delete(f"{BACK_BASE_URL}/user/{user_id}", headers={"Authorization": f"Bearer {token}"})
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code, 
                detail=response.json().get("detail", "Error from backend")
            )
        return {"detail": "User deleted successfully"}
    
@api_router.post("/itineraries/create", response_model=dict, tags=["Itineraries"])
async def create_itinerary(new_itinerary: dict, token: str = Depends(oauth2_scheme)):
    async with AsyncClient() as client:
        response = await client.post(f"{API_BASE_URL}/itineraries/create", json=new_itinerary, headers={"Authorization": f"Bearer {token}"})
        return response.json()

@api_router.get("/itineraries/get/{itinerary_id}",response_model=dict, tags=["Itineraries"])
async def get_itinerary(itinerary_id: str, token: str = Depends(oauth2_scheme)):
    async with AsyncClient() as client:
        response = await client.get(f"{API_BASE_URL}/itineraries/get/{itinerary_id}", headers={"Authorization": f"Bearer {token}"})
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code, 
                detail=response.json().get("detail", "Error from backend")
            )
        return response.json()

    
@api_router.get("/itineraries/byUser/{itinerary_id}",response_model=dict, tags=["Itineraries"])
async def get_itinerary(itinerary_id: str, token: str = Depends(oauth2_scheme)):
    async with AsyncClient(timeout=60*5) as client:
        response = await client.get(f"{API_BASE_URL}/itineraries/byUser/{itinerary_id}", headers={"Authorization": f"Bearer {token}"})
        return {"itineraries": response.json()}
   
@api_router.patch("/itineraries/modify/{itinerary_id}",response_model=dict, tags=["Itineraries"])
async def modify_itinerary(itinerary_id: str, new_itinerary:dict, token: str = Depends(oauth2_scheme)):
    async with AsyncClient() as client:
        response = await client.patch(f"{API_BASE_URL}/itineraries/modify/{itinerary_id}", json=new_itinerary, headers={"Authorization": f"Bearer {token}"})
        return response.json()

@api_router.delete("/itineraries/delete/{itinerary_id}",response_model=dict, tags=["Itineraries"])
async def delete_itinerary(itinerary_id: str, token: str = Depends(oauth2_scheme)):
    async with AsyncClient() as client:
        response = await client.delete(f"{API_BASE_URL}/itineraries/delete/{itinerary_id}", headers={"Authorization": f"Bearer {token}"})
        return response.json()

@api_router.delete("/itineraries/deleteByOwner/{owner}",response_model=dict, tags=["Itineraries"])
async def delete_itinerary_byOwner(owner: str, token: str = Depends(oauth2_scheme)):
    async with AsyncClient() as client:
        response = await client.delete(f"{API_BASE_URL}/itineraries/deleteByOwner/{owner}", headers={"Authorization": f"Bearer {token}"})
        if response.status_code != 200:
            return {"error": "Failed to delete itinerary, status code: {}".format(response.status_code)}
        try:
            return response.json()
        except json.JSONDecodeError:
            return {"error": "Invalid response format"}

@api_router.patch("/itinerariesDays/add/{itinerary_id}", tags=["Itineraries"])
async def add_itinerary_day(itinerary_id: str, new_day:dict, token: str = Depends(oauth2_scheme)):
    async with AsyncClient() as client:
        response = await client.patch(f"{API_BASE_URL}/itinerariesDays/add/{itinerary_id}", json=new_day, headers={"Authorization": f"Bearer {token}"})
        if response.status_code != 200:
            try:
                error_details = response.json()
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_details.get("error", "Failed to add itinerary day")
                )
            except ValueError:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to add itinerary day. No detailed error response."
                )
        return response.json()
    
@api_router.delete("/itinerariesDays/delete/{itinerary_id}/days/{index}", tags=["Itineraries"])
async def delete_itinerary_day(itinerary_id: str, index: int, token: str = Depends(oauth2_scheme)):
    async with AsyncClient() as client:
        response = await client.delete(f"{API_BASE_URL}/itinerariesDays/delete/{itinerary_id}/days/{index}", headers={"Authorization": f"Bearer {token}"})
        if response.status_code != 200:
            try:
                error_details = response.json()
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_details.get("error", "Failed to delete itinerary day")
                )
            except ValueError:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to delete itinerary day. No detailed error response."
                )
        return response.json()

@api_router.post("/itineraries/personalize/{city}/{country}", response_model=dict, status_code=200, tags=["Itineraries"])
async def personalize_itinerary(city: str, country: str, prompt: PersonalizedItinerary, token: str = Depends(oauth2_scheme)):
    async with AsyncClient(timeout=60*5) as client:
        try:
            response = await client.post(f"{API_BASE_URL}/itineraries/personalize/{city}/{country}", json=prompt.dict(), headers={"Authorization": f"Bearer {token}"})
            return {"data": response.json()}
        except json.JSONDecodeError:
            return {"error": "Invalid JSON response", "content": response}
        
@api_router.get("/place/info/{city}/{country}",response_model=dict, tags=["Places"])
async def get_itinerary(city: str, country: str, token: str = Depends(oauth2_scheme)):
    async with AsyncClient() as client:
        response = await client.get(f"{API_BASE_URL}/place/info/{city}/{country}", headers={"Authorization": f"Bearer {token}"})
        return response.json()
       
@api_router.post("/destination", response_model=dict, tags=["Places"])
async def create_destination(new_destination: dict, token: str = Depends(oauth2_scheme)):
    async with AsyncClient() as client:
        response = await client.post(f"{API_BASE_URL}/destination", json=new_destination)
        return response.json()

@api_router.get("/destination/{destination_id}",response_model=dict, tags=["Places"])
async def get_destination(destination_id: str, token: str = Depends(oauth2_scheme)):
    async with AsyncClient() as client:
        response = await client.get(f"{API_BASE_URL}/destination/{destination_id}", headers={"Authorization": f"Bearer {token}"})
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code, 
                detail=response.json().get("detail", "Error from backend")
            )
        return response.json()

@api_router.delete("/destination/{destination_id}",response_model=dict, tags=["Places"])
async def delete_destination(destination_id: str, token: str = Depends(oauth2_scheme)):
    async with AsyncClient() as client:
        response = await client.delete(f"{API_BASE_URL}/destination/{destination_id}", headers={"Authorization": f"Bearer {token}"})
        return response.json()

app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8888, log_level="debug")
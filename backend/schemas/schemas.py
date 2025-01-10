from pydantic import BaseModel

class UserSchema(BaseModel):
    id: str
    name: str
    email: str
    date_of_birth: str

class CreateUserSchema(BaseModel):
    name: str
    email: str
    date_of_birth: str
    password: str
    
class UserCredentials(BaseModel):
    email: str
    password: str
    
class GoogleAuth(BaseModel):
    code: str
    redirect_uri: str
    grant_type: str
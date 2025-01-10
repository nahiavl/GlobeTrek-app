from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel
from sqlalchemy.orm import Session

from crud.base import CRUDBase
from db.db import User
from argon2 import PasswordHasher

ph = PasswordHasher()

class UserCreate(BaseModel):
    name: str = None
    birthday: Optional[str] = None
    email: str = None
    password: Optional[str] = None
    countries: Optional[List[str]] = None

class CRUDUser(CRUDBase[User, UserCreate]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def create(self, db: Session, obj_in: UserCreate) -> User:
        create_data = obj_in.dict(exclude_unset=True)
        if create_data.get('password'):
            create_data['password'] = ph.hash(create_data['password'])
        db_obj = User(**create_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def is_superuser(self, user: User) -> bool:
        return user.is_superuser

user = CRUDUser(User)
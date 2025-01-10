import sqlalchemy
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, String, Date, Integer, create_engine
from sqlalchemy.engine import URL
from sqlalchemy_utils import drop_database, database_exists, create_database
from config import Settings
config = Settings()

engine = create_engine(config.DATABASE_URL)

if not database_exists(engine.url):
    create_database(engine.url)

Base = declarative_base()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class User(Base):
    __tablename__ = 'user'

    id = Column(Integer, primary_key=True)
    name = Column(String(255))
    birthday = Column(Date)
    email = Column(String(255))
    countries = Column(String(10000))
    password = Column(String, nullable=True)
    
    def __init__(self, name, birthday, email, password, countries):
        self.name = name
        self.birthday = birthday
        self.email = email
        self.password = password
        self.countries = countries

try:
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")
except Exception as e:
    print(f"An error occurred: {e}")

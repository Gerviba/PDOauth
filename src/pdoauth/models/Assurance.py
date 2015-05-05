from pdoauth.app import db
from sqlalchemy.sql.schema import Column, ForeignKey
from sqlalchemy.sql.sqltypes import String, Integer
from sqlalchemy.orm import relationship
from pdoauth.models.User import User
import time
from pdoauth.ModelUtils import ModelUtils

class Assurance(db.Model, ModelUtils):
    __tablename__ = 'assurance'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    timestamp = Column(Integer)
    user_id = Column(Integer, ForeignKey('user.id'))
    user = relationship(User, foreign_keys=[user_id])
    assurer_id = Column(Integer, ForeignKey('user.id'))
    assurer = relationship(User, foreign_keys=[assurer_id])

    def __init__(self, user, name, assurer, timestamp):
        self.user = user
        self.name = name
        self.assurer = assurer
        self.timestamp = timestamp
        
    @classmethod
    def getByUser(cls, user):
        assurances = Assurance.query.filter_by(user=user).all()
        r = {}
        for ass in assurances:
            r[ass.name] = ass
        return r

    @classmethod
    def new(cls, user, name, assurer, timestamp = None):
        if timestamp is None:
            timestamp = time.time()
        assurance = cls(user, name, assurer, timestamp)
        assurance.save()
        return assurance
            
    
    
    
    

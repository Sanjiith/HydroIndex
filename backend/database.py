from pymongo import MongoClient
from datetime import datetime,timedelta
import os
from typing import List, Dict, Optional

class MongoDBManager:
    def __init__(self, connection_string: str = None, db_name: str = "water_quality"):
        self.connection_string = connection_string or os.getenv("MONGODB_URI")
        self.db_name = db_name
        self.client = None
        self.db = None
        self.connect()
    
    def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = MongoClient(self.connection_string)
            self.db = self.client[self.db_name]
            print("Connected to MongoDB successfully")
        except Exception as e:
            print(f"Error connecting to MongoDB: {e}")
    
    def insert_sample(self, sample_data: Dict) -> str:
        """Insert a single sample into the database"""
        sample_data['created_at'] = datetime.utcnow()
        result = self.db.samples.insert_one(sample_data)
        return str(result.inserted_id)
    
    def get_samples(self, days: int = 30, location: Optional[str] = None) -> List[Dict]:
        """Get samples with optional filtering"""
        query = {}
        
        if days:
            start_date = datetime.utcnow() - timedelta(days=days)
            query['created_at'] = {'$gte': start_date}
        
        if location:
            query['location_name'] = {'$regex': location, '$options': 'i'}
        
        samples = list(self.db.samples.find(query).sort('created_at', -1))
        
        # Convert ObjectId to string for JSON serialization
        for sample in samples:
            sample['_id'] = str(sample['_id'])
        
        return samples
    
    def delete_samples(self, delete_option: str, start_date: str = None, 
                      end_date: str = None, sample_ids: List[str] = None) -> Dict:
        """Delete samples based on criteria"""
        query = {}
        
        if delete_option == "all":
            query = {}
        elif delete_option == "date_range" and start_date and end_date:
            start_dt = datetime.fromisoformat(start_date)
            end_dt = datetime.fromisoformat(end_date)
            query['created_at'] = {'$gte': start_dt, '$lte': end_dt}
        elif delete_option == "selected" and sample_ids:
            from bson.objectid import ObjectId
            query['_id'] = {'$in': [ObjectId(id) for id in sample_ids]}
        else:
            return {"success": False, "message": "Invalid delete parameters"}
        
        result = self.db.samples.delete_many(query)
        return {
            "success": True, 
            "message": f"Deleted {result.deleted_count} samples",
            "deleted_count": result.deleted_count
        }
    
    def get_sample_by_id(self, sample_id: str) -> Optional[Dict]:
        """Get a single sample by ID"""
        from bson.objectid import ObjectId
        sample = self.db.samples.find_one({'_id': ObjectId(sample_id)})
        if sample:
            sample['_id'] = str(sample['_id'])
        return sample
    
    def close(self):
        """Close the database connection"""
        if self.client:
            self.client.close()

# Singleton instance
db_manager = MongoDBManager()
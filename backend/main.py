from fastapi import FastAPI, HTTPException, Query, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import io
import json
import tempfile
import os
import asyncio
from concurrent.futures import ThreadPoolExecutor
import uuid
from PyPDF2 import PdfReader

from water_quality_model import WaterSafetyPredictor
from database import db_manager

# Initialize FastAPI app
app = FastAPI(title="Water Quality Monitoring API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for batch processing
batch_jobs = {}
MAX_WORKERS = 4  # Limit concurrent workers
CHUNK_SIZE = 100  # Process 100 samples at a time

# Thread pool for CPU-intensive tasks
thread_pool = ThreadPoolExecutor(max_workers=MAX_WORKERS)

# Load the trained model
try:
    predictor = WaterSafetyPredictor.load_model('water_quality_model.pkl')
    print("Model loaded successfully")
except Exception as e:
    print(f"Error loading model: {e}")
    # Train a new model if loading fails
    predictor = WaterSafetyPredictor()
    geo_dataset, y = predictor.generate_sample_data()
    X = geo_dataset[predictor.hmpi_metals]
    accuracy = predictor.train_model(X, y)
    predictor.save_model('water_quality_model.pkl')
    print(f"New model trained with accuracy: {accuracy:.2f}")

# Pydantic models
class SampleData(BaseModel):
    location_name: Optional[str] = "Unknown"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    arsenic: Optional[float] = 0.0
    lead: Optional[float] = 0.0
    cadmium: Optional[float] = 0.0
    chromium: Optional[float] = 0.0
    mercury: Optional[float] = 0.0
    nickel: Optional[float] = 0.0
    copper: Optional[float] = 0.0
    zinc: Optional[float] = 0.0
    iron: Optional[float] = 0.0
    manganese: Optional[float] = 0.0
    unit_input: Optional[str] = "Auto-detect"

class AnalysisResponse(BaseModel):
    sample_id: str
    timestamp: str
    analysis_results: Dict[str, Any]
    ml_prediction: Dict[str, Any]
    recommendations: Dict[str, Any]
    unit_detected: str

class BatchProcessRequest(BaseModel):
    samples: List[SampleData]

class DeleteRequest(BaseModel):
    delete_option: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    sample_ids: Optional[List[str]] = None

class FileUploadResponse(BaseModel):
    message: str
    total_samples: int
    processed_samples: int
    results: List[Dict]
    available_metals: List[str]

class BatchJobResponse(BaseModel):
    job_id: str
    status: str
    message: str
    progress: float
    total_samples: int
    processed_samples: int
    results: Optional[List[Dict]] = None

# Improved helper function to process uploaded files
def process_uploaded_file(file: UploadFile):
    """Process uploaded CSV, Excel, or PDF file"""
    file_ext = file.filename.split('.')[-1].lower()
    
    try:
        if file_ext == 'csv':
            df = pd.read_csv(file.file)
        elif file_ext in ['xlsx', 'xls']:
            df = pd.read_excel(file.file)
        elif file_ext == 'pdf':
            # For PDFs, extract text and try to find tabular data
            pdf_text = ""
            pdf_reader = PdfReader(file.file)
            for page in pdf_reader.pages:
                pdf_text += page.extract_text()
            
            # Try to extract table data from PDF text
            lines = pdf_text.split('\n')
            data = []
            for line in lines:
                if any(char.isdigit() for char in line):
                    values = line.split()
                    if len(values) >= 7:  # Assuming at least 7 numeric values
                        try:
                            numeric_values = [float(v) for v in values if v.replace('.', '').replace('-', '').isdigit()]
                            if len(numeric_values) >= 7:
                                data.append(numeric_values[:7])
                        except:
                            continue
            
            if data:
                df = pd.DataFrame(data, columns=predictor.hmpi_metals[:7])
            else:
                raise ValueError("Could not extract tabular data from PDF")
        else:
            raise ValueError("Unsupported file format")
        
        # Check which HMPI metals are available in the dataset
        available_metals = [metal for metal in predictor.hmpi_metals if metal in df.columns]
        
        if not available_metals:
            # Try to find columns that might match our metals
            column_mapping = {}
            for metal in predictor.hmpi_metals:
                for col in df.columns:
                    if metal.lower() in col.lower():
                        column_mapping[metal] = col
                        break
            
            if column_mapping:
                df = df.rename(columns={v: k for k, v in column_mapping.items()})
                available_metals = list(column_mapping.keys())
            else:
                # Try to use the first few numeric columns
                numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
                if len(numeric_cols) >= len(predictor.hmpi_metals):
                    for i, metal in enumerate(predictor.hmpi_metals):
                        if i < len(numeric_cols):
                            df[metal] = df[numeric_cols[i]]
                    available_metals = predictor.hmpi_metals[:len(numeric_cols)]
                else:
                    # Use available numeric columns
                    available_metals = predictor.hmpi_metals[:len(numeric_cols)]
                    for i, metal in enumerate(available_metals):
                        if i < len(numeric_cols):
                            df[metal] = df[numeric_cols[i]]
        
        # Fill NaN values with 0 for calculation
        df = df.fillna(0)
        
        return df, available_metals
        
    except Exception as e:
        raise ValueError(f"Error processing file: {str(e)}")

# Improved unit detection function
def auto_detect_unit(sample_data: Dict) -> str:
    """
    Auto-detect whether concentrations are in mg/L or µg/L
    Improved detection logic
    """
    metal_values = []
    metals_to_check = ['arsenic', 'lead', 'cadmium', 'chromium', 'mercury', 'nickel', 'copper', 'zinc', 'iron', 'manganese']
    
    for metal in metals_to_check:
        if (metal in sample_data and 
            sample_data[metal] is not None and 
            not pd.isna(sample_data[metal])):
            metal_values.append(sample_data[metal])
    
    if not metal_values:
        return "µg/L"  # Default assumption if no data
    
    # Use more sophisticated detection
    median_conc = np.median(metal_values)
    
    if median_conc < 0.01:
        return "mg/L"
    elif median_conc < 1.0:
        # Check distribution
        low_count = sum(1 for val in metal_values if val < 0.1)
        return "mg/L" if low_count >= len(metal_values) * 0.6 else "µg/L"
    else:
        return "µg/L"

# Fixed generate_recommendations function (removed self parameter)
def generate_recommendations(analysis_results):
    """Generate specific recommendations based on analysis results"""
    hmpi_level = analysis_results['hmpi']['level']
    pli_level = analysis_results['pli']['level']
    
    recommendations = []
    
    if hmpi_level == "Safe":
        recommendations.extend([
            "Water is safe for drinking",
            "Regular monitoring recommended",
            "Maintain current water treatment processes"
        ])
    elif hmpi_level == "Moderate":
        recommendations.extend([
            "Water requires treatment before consumption",
            "Consider filtration systems",
            "Increase monitoring frequency",
            "Test for specific metal contaminants"
        ])
    else:  # Critical
        recommendations.extend([
            "Water is not safe for drinking",
            "Immediate treatment required",
            "Consider alternative water sources",
            "Consult with water quality experts",
            "Implement emergency treatment measures"
        ])
    
    # Add specific metal recommendations
    for metal, cf_data in analysis_results['contamination_factors'].items():
        if cf_data['level'] in ["Considerable contamination", "Very high contamination"]:
            recommendations.append(f"High {metal} levels detected - specific treatment needed")
    
    return recommendations

# Optimized batch processing function
def process_sample_chunk(chunk_data, chunk_id, job_id):
    """Process a chunk of samples in a separate thread"""
    try:
        results = []
        for idx, row in enumerate(chunk_data):
            try:
                # Update progress
                batch_jobs[job_id]['processed'] += 1
                progress = (batch_jobs[job_id]['processed'] / batch_jobs[job_id]['total']) * 100
                batch_jobs[job_id]['progress'] = progress
                
                # Extract available metals for calculation
                sample_data = {}
                available_metals = batch_jobs[job_id]['available_metals']
                
                for metal in available_metals:
                    if metal in row and not pd.isna(row[metal]):
                        sample_data[metal] = float(row[metal])
                    else:
                        sample_data[metal] = 0.0
                
                # Preserve geographical and location data
                geo_columns = ['latitude', 'longitude', 'Latitude', 'Longitude', 'location', 'Location', 'location_name', 'Location_Name']
                for geo_col in geo_columns:
                    if geo_col in row and not pd.isna(row[geo_col]):
                        sample_data[geo_col] = row[geo_col]
                
                if not sample_data:
                    continue
                
                # Auto-detect unit for each sample
                detected_unit = auto_detect_unit(sample_data)
                
                # Calculate comprehensive indices
                comprehensive_results = predictor.calculate_comprehensive_indices(sample_data)
                comprehensive_results['unit_detected'] = detected_unit
                
                # ML Prediction
                ml_input = []
                for metal in predictor.hmpi_metals:
                    ml_input.append(sample_data.get(metal, 0.0))
                
                ml_prediction, probabilities = predictor.predict_pollution(ml_input)
                
                # Prepare data for database
                db_sample = {
                    **sample_data,
                    'hmpi_score': comprehensive_results['hmpi']['score'],
                    'pli_score': comprehensive_results['pli']['score'],
                    'pollution_level': comprehensive_results['hmpi']['level'],
                    'unit_detected': detected_unit,
                    'timestamp': datetime.utcnow().isoformat()
                }
                
                # Add location name if available
                location_cols = ['location_name', 'Location', 'location', 'Location_Name']
                for loc_col in location_cols:
                    if loc_col in row and not pd.isna(row[loc_col]):
                        db_sample['location_name'] = row[loc_col]
                        break
                else:
                    db_sample['location_name'] = f"Batch Sample {chunk_id * len(chunk_data) + idx + 1}"
                
                # Save to database (consider bulk insert optimization)
                sample_id = db_manager.insert_sample(db_sample)
                
                result_row = {
                    'sample_id': sample_id,
                    'row_id': chunk_id * len(chunk_data) + idx + 1,
                    'hmpi_score': comprehensive_results['hmpi']['score'],
                    'pli_score': comprehensive_results['pli']['score'],
                    'pollution_level': comprehensive_results['hmpi']['level'],
                    'pli_level': comprehensive_results['pli']['level'],
                    'recommendation': comprehensive_results['hmpi']['recommendation'],
                    'unit_detected': detected_unit,
                    'ml_prediction': ml_prediction,
                    **sample_data
                }
                
                # Add contamination factors
                for metal, cf_data in comprehensive_results['contamination_factors'].items():
                    result_row[f'{metal}_cf'] = cf_data['cf_value']
                    result_row[f'{metal}_cf_level'] = cf_data['level']
                
                results.append(result_row)
                
            except Exception as e:
                print(f"Error processing row {chunk_id * len(chunk_data) + idx + 1}: {e}")
                continue
        
        return results
        
    except Exception as e:
        print(f"Error processing chunk {chunk_id}: {e}")
        return []

async def process_large_batch_async(job_id: str, df: pd.DataFrame, available_metals: List[str]):
    """Process large batch asynchronously in chunks"""
    try:
        # Split dataframe into chunks
        chunks = [df[i:i + CHUNK_SIZE] for i in range(0, len(df), CHUNK_SIZE)]
        
        # Initialize job tracking
        batch_jobs[job_id] = {
            'status': 'processing',
            'progress': 0.0,
            'total': len(df),
            'processed': 0,
            'results': [],
            'available_metals': available_metals,
            'start_time': datetime.utcnow()
        }
        
        # Process chunks in parallel using thread pool
        loop = asyncio.get_event_loop()
        futures = []
        
        for chunk_id, chunk in enumerate(chunks):
            future = loop.run_in_executor(
                thread_pool, 
                process_sample_chunk, 
                chunk.to_dict('records'), 
                chunk_id, 
                job_id
            )
            futures.append(future)
        
        # Wait for all chunks to complete
        chunk_results = await asyncio.gather(*futures)
        
        # Combine results
        all_results = []
        for results in chunk_results:
            all_results.extend(results)
        
        # Update job status
        batch_jobs[job_id]['status'] = 'completed'
        batch_jobs[job_id]['results'] = all_results
        batch_jobs[job_id]['end_time'] = datetime.utcnow()
        
        print(f"Batch job {job_id} completed. Processed {len(all_results)} samples.")
        
    except Exception as e:
        batch_jobs[job_id]['status'] = 'failed'
        batch_jobs[job_id]['error'] = str(e)
        print(f"Batch job {job_id} failed: {e}")

# API endpoints
@app.get("/")
async def root():
    return {"message": "Water Quality Monitoring API", "status": "active"}

@app.post("/analyze-sample", response_model=AnalysisResponse)
async def analyze_sample(sample: SampleData):
    """Analyze a single water sample with auto unit detection"""
    try:
        # Prepare sample data
        sample_data = sample.dict()
        unit_input = sample_data.pop('unit_input', 'Auto-detect')
        
        # Auto-detect unit if requested
        if unit_input == "Auto-detect":
            detected_unit = auto_detect_unit(sample_data)
            print(f"Auto-detected unit: {detected_unit}")
        else:
            detected_unit = unit_input
        
        # Calculate comprehensive indices - USING FIXED CALCULATION
        comprehensive_results = predictor.calculate_comprehensive_indices(sample_data)
        
        # ML Prediction
        ml_input = []
        for metal in predictor.hmpi_metals:
            ml_input.append(sample_data.get(metal, 0.0))
        
        ml_prediction, probabilities = predictor.predict_pollution(ml_input)
        
        # Prepare data for database
        db_sample = {
            **sample_data,
            'hmpi_score': comprehensive_results['hmpi']['score'],
            'pli_score': comprehensive_results['pli']['score'],
            'total_cf_score': comprehensive_results['total_cf']['score'],
            'pollution_level': comprehensive_results['hmpi']['level'],
            'unit_detected': detected_unit,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Save to database
        sample_id = db_manager.insert_sample(db_sample)
        
        # Prepare CORRECTED response
        response = {
            'sample_id': sample_id,
            'timestamp': db_sample['timestamp'],
            'analysis_results': comprehensive_results,
            'ml_prediction': {
                'prediction': ml_prediction,
                'confidence': {k: float(v) for k, v in zip(predictor.label_encoder.classes_, probabilities)}
            } if hasattr(predictor.label_encoder, 'classes_') else {'prediction': 'N/A', 'confidence': {}},
            'recommendations': {
                'overall': comprehensive_results['hmpi']['recommendation'],
                'compliance_status': "Compliant" if comprehensive_results['hmpi']['level'] == "Safe" else "Non-Compliant",
                'actions': generate_recommendations(comprehensive_results)
            },
            'unit_detected': detected_unit
        }
        
        return AnalysisResponse(**response)
        
    except Exception as e:
        print(f"Error in analyze-sample: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing sample: {str(e)}")

@app.post("/upload-file-large")
async def upload_file_large(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """Upload and process large files asynchronously"""
    try:
        # Generate job ID
        job_id = str(uuid.uuid4())
        
        # Process the uploaded file
        df, available_metals = process_uploaded_file(file)
        
        # Start background processing for large files
        if len(df) > 100:  # Use async processing for files with more than 100 samples
            background_tasks.add_task(process_large_batch_async, job_id, df, available_metals)
            
            return {
                "job_id": job_id,
                "message": f"Large file processing started. {len(df)} samples queued for processing.",
                "total_samples": len(df),
                "status": "processing"
            }
        else:
            # Use existing synchronous processing for small files
            return await upload_file(file)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.get("/batch-status/{job_id}")
async def get_batch_status(job_id: str):
    """Check status of a batch processing job"""
    if job_id not in batch_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = batch_jobs[job_id]
    response = {
        "job_id": job_id,
        "status": job['status'],
        "progress": job['progress'],
        "processed_samples": job['processed'],
        "total_samples": job['total']
    }
    
    if job['status'] == 'completed':
        response["results"] = job['results']
        response["message"] = f"Processing completed. {len(job['results'])} samples processed."
    elif job['status'] == 'failed':
        response["error"] = job.get('error', 'Unknown error')
    
    return response

@app.post("/upload-file", response_model=FileUploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """Upload and process CSV, Excel, or PDF files with auto unit detection - for small files"""
    try:
        # Process the uploaded file
        df, available_metals = process_uploaded_file(file)
        
        # For large files, recommend using the async endpoint
        if len(df) > 500:
            return FileUploadResponse(
                message=f"File has {len(df)} samples. For better performance with large files, use /upload-file-large endpoint.",
                total_samples=len(df),
                processed_samples=0,
                results=[],
                available_metals=available_metals
            )
        
        results = []
        processed_count = 0
        
        for idx, row in df.iterrows():
            try:
                # Extract available metals for calculation
                sample_data = {}
                for metal in available_metals:
                    if metal in row and not pd.isna(row[metal]):
                        sample_data[metal] = float(row[metal])
                    else:
                        sample_data[metal] = 0.0
                
                # Preserve geographical and location data
                geo_columns = ['latitude', 'longitude', 'Latitude', 'Longitude', 'location', 'Location', 'location_name', 'Location_Name']
                for geo_col in geo_columns:
                    if geo_col in row and not pd.isna(row[geo_col]):
                        sample_data[geo_col] = row[geo_col]
                
                if not sample_data:
                    continue
                
                # Auto-detect unit for each sample
                detected_unit = auto_detect_unit(sample_data)
                
                # Calculate comprehensive indices
                comprehensive_results = predictor.calculate_comprehensive_indices(sample_data)
                comprehensive_results['unit_detected'] = detected_unit
                
                # ML Prediction
                ml_input = []
                for metal in predictor.hmpi_metals:
                    ml_input.append(sample_data.get(metal, 0.0))
                
                ml_prediction, probabilities = predictor.predict_pollution(ml_input)
                
                # Prepare data for database
                db_sample = {
                    **sample_data,
                    'hmpi_score': comprehensive_results['hmpi']['score'],
                    'pli_score': comprehensive_results['pli']['score'],
                    'pollution_level': comprehensive_results['hmpi']['level'],
                    'unit_detected': detected_unit,
                    'timestamp': datetime.utcnow().isoformat()
                }
                
                # Add location name if available
                location_cols = ['location_name', 'Location', 'location', 'Location_Name']
                for loc_col in location_cols:
                    if loc_col in row and not pd.isna(row[loc_col]):
                        db_sample['location_name'] = row[loc_col]
                        break
                else:
                    db_sample['location_name'] = f"Batch Sample {idx + 1}"
                
                # Save to database
                sample_id = db_manager.insert_sample(db_sample)
                
                result_row = {
                    'sample_id': sample_id,
                    'row_id': idx + 1,
                    'hmpi_score': comprehensive_results['hmpi']['score'],
                    'pli_score': comprehensive_results['pli']['score'],
                    'pollution_level': comprehensive_results['hmpi']['level'],
                    'pli_level': comprehensive_results['pli']['level'],
                    'recommendation': comprehensive_results['hmpi']['recommendation'],
                    'unit_detected': detected_unit,
                    'ml_prediction': ml_prediction,
                    **sample_data
                }
                
                # Add contamination factors
                for metal, cf_data in comprehensive_results['contamination_factors'].items():
                    result_row[f'{metal}_cf'] = cf_data['cf_value']
                    result_row[f'{metal}_cf_level'] = cf_data['level']
                
                results.append(result_row)
                processed_count += 1
                
            except Exception as e:
                # Skip problematic rows but continue processing
                print(f"Error processing row {idx + 1}: {e}")
                continue
        
        return FileUploadResponse(
            message=f"File processed successfully. Processed {processed_count} out of {len(df)} samples.",
            total_samples=len(df),
            processed_samples=processed_count,
            results=results,
            available_metals=available_metals
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

# ... (keep the rest of your existing endpoints unchanged - get_samples, get_sample, delete_samples, statistics, export_csv, health, model-info)

@app.post("/batch-analyze")
async def batch_analyze(samples: BatchProcessRequest):
    """Analyze multiple samples in batch via JSON with auto unit detection"""
    try:
        # For large batches, use async processing
        if len(samples.samples) > 100:
            job_id = str(uuid.uuid4())
            
            # Convert to DataFrame for processing
            samples_dict = [sample.dict() for sample in samples.samples]
            df = pd.DataFrame(samples_dict)
            
            # Start background processing
            asyncio.create_task(process_large_batch_async(job_id, df, predictor.hmpi_metals))
            
            return {
                "job_id": job_id,
                "message": f"Batch analysis started for {len(samples.samples)} samples.",
                "status": "processing"
            }
        
        # Small batch - process synchronously
        results = []
        
        for sample in samples.samples:
            sample_data = sample.dict()
            unit_input = sample_data.pop('unit_input', 'Auto-detect')
            
            # Auto-detect unit if requested
            if unit_input == "Auto-detect":
                detected_unit = auto_detect_unit(sample_data)
            else:
                detected_unit = unit_input
            
            comprehensive_results = predictor.calculate_comprehensive_indices(sample_data)
            comprehensive_results['unit_detected'] = detected_unit
            
            # ML Prediction
            ml_input = []
            for metal in predictor.hmpi_metals:
                ml_input.append(sample_data.get(metal, 0.0))
            
            ml_prediction, probabilities = predictor.predict_pollution(ml_input)
            
            # Save to database
            db_sample = {
                **sample_data,
                'hmpi_score': comprehensive_results['hmpi']['score'],
                'pli_score': comprehensive_results['pli']['score'],
                'pollution_level': comprehensive_results['hmpi']['level'],
                'unit_detected': detected_unit,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            sample_id = db_manager.insert_sample(db_sample)
            
            results.append({
                'sample_id': sample_id,
                'analysis_results': comprehensive_results,
                'ml_prediction': {
                    'prediction': ml_prediction,
                    'confidence': {predictor.label_encoder.classes_[i]: float(probabilities[i]) 
                                 for i in range(len(probabilities))}
                },
                'unit_detected': detected_unit
            })
        
        return {"results": results, "total_samples": len(results)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in batch analysis: {str(e)}")

# ... (keep all your other existing endpoints)

# Clean up completed jobs periodically
@app.on_event("startup")
async def startup_event():
    """Initialize cleanup task on startup"""
    asyncio.create_task(cleanup_completed_jobs())

async def cleanup_completed_jobs():
    """Clean up completed jobs older than 1 hour"""
    while True:
        await asyncio.sleep(3600)  # Run every hour
        current_time = datetime.utcnow()
        jobs_to_delete = []
        
        for job_id, job in batch_jobs.items():
            if job['status'] in ['completed', 'failed']:
                end_time = job.get('end_time', job.get('start_time'))
                if (current_time - end_time).total_seconds() > 3600:  # 1 hour
                    jobs_to_delete.append(job_id)
        
        for job_id in jobs_to_delete:
            del batch_jobs[job_id]
        
        if jobs_to_delete:
            print(f"Cleaned up {len(jobs_to_delete)} completed jobs")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
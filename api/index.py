from flask import Flask, request, jsonify
import requests
import pandas as pd
import geopandas as gpd
import io

app = Flask(__name__)

# Define the sector metrics
SECTOR_METRICS = {
    'Arts & Zoo': {'threshold': 1000, 'condition': 'greater_than'},
    'City or Town Option': {'threshold': 2000, 'condition': 'greater_than'},
    'Correctional Facility': {'threshold': 1500, 'condition': 'greater_than'},
    'County Highway & Public Transit – County Portion': {'threshold': 500, 'condition': 'greater_than'},
    'County Highway & Public Transit – Local Portion': {'threshold': 500, 'condition': 'greater_than'},
    'County Highway & Public Transit – Transit District Portion': {'threshold': 500, 'condition': 'greater_than'},
    'County Option': {'threshold': 1000, 'condition': 'greater_than'},
    'County Public Transit Tax': {'threshold': 700, 'condition': 'greater_than'},
    'E-911 Emergency Services Telephone Charge': {'threshold': 800, 'condition': 'greater_than'},
    'Fixed Guideway': {'threshold': 1200, 'condition': 'greater_than'},
    'Highway Option': {'threshold': 1000, 'condition': 'greater_than'},
    'Highway Projects (1)': {'threshold': 1000, 'condition': 'greater_than'},
    'Highway Projects (2)': {'threshold': 1000, 'condition': 'greater_than'},
    'Highway Projects (3)': {'threshold': 1000, 'condition': 'greater_than'},
    'Mass Transit': {'threshold': 900, 'condition': 'greater_than'},
    'Mass Transit Additional': {'threshold': 900, 'condition': 'greater_than'},
    'Mass Transit Corridor Preservation': {'threshold': 1000, 'condition': 'greater_than'},
    'Mass Transit County': {'threshold': 1000, 'condition': 'greater_than'},
    'MIDA Transient Room': {'threshold': 1000, 'condition': 'greater_than'},
    'Municipal Energy': {'threshold': 500, 'condition': 'greater_than'},
    'Municipal Telecom': {'threshold': 300, 'condition': 'greater_than'},
    'Off Highway & Recreational Vehicle Short Term Leasing': {'threshold': 600, 'condition': 'greater_than'},
    'Resort Communities': {'threshold': 2000, 'condition': 'greater_than'},
    'Restaurant': {'threshold': 2500, 'condition': 'greater_than'},
    'Rural Hospital': {'threshold': 700, 'condition': 'greater_than'},
    'Sales and Use': {'threshold': 3000, 'condition': 'greater_than'},
    'Short-term Leasing': {'threshold': 1500, 'condition': 'greater_than'},
    'State Mass Transit': {'threshold': 1000, 'condition': 'greater_than'},
    'Tourism Transient Room': {'threshold': 2000, 'condition': 'greater_than'},
    'Town Option': {'threshold': 800, 'condition': 'greater_than'},
    'Transient Room': {'threshold': 1000, 'condition': 'greater_than'},
}

# Function to download the Excel file from the given URL
def download_excel_file(url):
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Failed to download file. HTTP Status code: {response.status_code}")
    return response.content

# Function to load dataset from the downloaded Excel file
def load_dataset_from_excel(content):
    excel_data = io.BytesIO(content)
    return pd.read_excel(excel_data)

# Function to process and classify data
def process_and_classify_data(df):
    df = df.melt(id_vars=['Tax Type', 'Co/City', 'Locality'], var_name='Fiscal Year', value_name='Amount')

    def classify_row(row):
        sector = row['Tax Type']
        amount = row['Amount']
        metric = SECTOR_METRICS.get(sector, {'threshold': 0, 'condition': 'greater_than'})
        
        if metric['condition'] == 'greater_than':
            if amount > metric['threshold']:
                return 'ON TRACK'
            else:
                return 'NOT MET'
        # Add more conditions as needed

    df['Classification'] = df.apply(classify_row, axis=1)
    return df

@app.route('/api/fetch-tax-data', methods=['POST'])
def fetch_tax_data():
    try:
        url = request.json.get('url')
        if not url:
            return jsonify({"error": "URL is required"}), 400

        content = download_excel_file(url)
        df = load_dataset_from_excel(content)
        classified_df = process_and_classify_data(df)
        return jsonify(classified_df.to_dict(orient='records'))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Water data processing functions
def load_dataset_from_url(url, response_format='json'):
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch data. HTTP Status code: {response.status_code}")
    
    if response_format == 'json':
        return response.json()
    elif response_format == 'geojson':
        return gpd.read_file(url)
    else:
        raise ValueError("Unsupported response format. Please use 'json' or 'geojson'.")

def json_to_dataframe(json_data):
    features = json_data['features']
    records = [feature['attributes'] for feature in features]
    return pd.DataFrame(records)

def filter_data_by_location(dataset, location):
    if 'SubArea' in dataset.columns:
        filtered_data = dataset[dataset['SubArea'].str.contains(location, case=False, na=False)]
    else:
        raise ValueError("Location filtering not supported for this dataset. Ensure 'SubArea' column exists.")
    return filtered_data

@app.route('/api/filter-water-data', methods=['POST'])
def filter_water_data():
    try:
        data = request.json
        url = data.get('url')
        location = data.get('location')
        response_format = data.get('response_format', 'json')
        
        if not url or not location:
            return jsonify({"error": "URL and location are required"}), 400

        if response_format == 'json':
            json_data = load_dataset_from_url(url, response_format)
            dataset = json_to_dataframe(json_data)
        else:
            dataset = load_dataset_from_url(url, response_format)
        
        filtered_data = filter_data_by_location(dataset, location)
        
        if filtered_data.empty:
            return jsonify({"message": "No matching records found for the specified location."})
        else:
            return jsonify(filtered_data.to_dict(orient='records'))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)

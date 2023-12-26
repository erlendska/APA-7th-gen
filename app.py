import torch
import torch.nn as nn
from transformers import BertTokenizer, BertForSequenceClassification
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
import os
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import ctypes

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def NeuralNet(text):
    input_text = text
    class BERT(nn.Module):
        def __init__(self):
            super(BERT, self).__init__()
            self.bert = BertForSequenceClassification.from_pretrained('bert-base-uncased', num_labels=2)
            
        def forward(self, input_ids, attention_mask):
            outputs = self.bert(input_ids, attention_mask=attention_mask)
            return outputs[0]

    PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models/BERT-net.pth')
    model = BERT()
    model.load_state_dict(torch.load(PATH, map_location=torch.device(device)))
    model.to(device)
    model.eval()

    input_tokens = tokenizer.encode_plus(
        input_text,
        add_special_tokens=True,
        max_length=32,
        truncation=True,
        padding='max_length',
        return_attention_mask=True,
        return_tensors='pt'
    )
    input_ids = input_tokens['input_ids'].to(device)
    attention_mask = input_tokens['attention_mask'].to(device)

    # Evaluate input with model
    model.eval()
    with torch.no_grad():
        output = model(input_ids, attention_mask)
        probabilities = torch.softmax(output, dim=1)[0]
        true_prob = probabilities[1].item()
        false_prob = probabilities[0].item()
        prediction = 'true' if true_prob > false_prob else 'false'
    
    print(f'\nInput text: {input_text}')
    print(f'Prediction: {prediction} (true: {true_prob*100:.2f} %, false: {false_prob*100:.2f} %)\n')
    return prediction



# Define a route to accept POST requests
@app.route('/predict', methods=['POST'])
def predict():
    # Parse the JSON data from the request body
    data = request.get_json()
    
    # Call your neural network with the input data
    result = NeuralNet(data)

    # Return the result as JSON
    response = jsonify(result)

    return response

if __name__ == '__main__':
    # Run the Flask app on port 5000
    ctypes.windll.user32.ShowWindow(ctypes.windll.kernel32.GetConsoleWindow(), 0)
    app.run(host='localhost', port=5000)


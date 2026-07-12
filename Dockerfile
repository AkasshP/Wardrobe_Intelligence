FROM public.ecr.aws/lambda/python:3.11

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip

# Copy and install backend requirements
COPY backend/requirements.txt ${LAMBDA_TASK_ROOT}/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Install Mangum (Lambda adapter), boto3, and other deps
RUN pip install --no-cache-dir mangum boto3 email-validator replicate stripe bcrypt==4.0.1

# Copy application code
COPY backend/app/ ${LAMBDA_TASK_ROOT}/app/
COPY backend/lambda_handler.py ${LAMBDA_TASK_ROOT}/

CMD ["lambda_handler.handler"]

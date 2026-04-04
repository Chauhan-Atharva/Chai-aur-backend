class ApiResponse {
    constructor(statusCode, data, message = "Success"){
        this.statusCode = statusCode; 
        this.data = data; 
        this.message = message;
        this.success = statusCode < 400; //no hard and fast rule - just my range 
    }
}

export {ApiResponse}
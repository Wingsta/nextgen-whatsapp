

export const sendResponse = (data : any, message: string = 'success', error: boolean = false) => {
    return {
        data ,
        message,
        error,
        success : !!error
    }
}

export const sendSuccessResponse = (data: any, message: string = "success") => {
  return {
    data,
    message,
    error: false,
    success: true,
  };
};

export const sendErrorResponse = ( message: string = "success", error = null,data?:any ) => {
  return {
    data: data || null ,
    message,
    error,
    success: false,
  };
};
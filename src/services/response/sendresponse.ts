

export const sendResponse = (data : any, message: string = 'success', error: boolean = false) => {
    return {
        data ,
        message,
        error,
        status : !!error
    }
}

export const sendSuccessResponse = (data: any, message: string = "success") => {
  return {
    data,
    message,
    error: false,
    status: true,
  };
};

export const sendErrorResponse = ( message: string = "success", error = null,data?:any ) => {
  return {
    data: data || null ,
    message,
    error,
    status: false,
  };
};
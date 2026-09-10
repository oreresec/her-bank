const axios = require('axios');

let nibssToken = null;
let tokenExpiry = null;

const getNibssToken = async () => {
    if (nibssToken && tokenExpiry > Date.now()) { return nibssToken; }
    const baseUrl = process.env.NIBSS_BASE_URL;
    if (!baseUrl) {
        throw new Error("NIBSS_BASE_URL is not defined in process.env. Check your .env file and dotenv setup.");
    }
    const url = `${baseUrl.trim()}/api/auth/token`;

    const response = await axios.post( `${process.env.NIBSS_BASE_URL}/api/auth/token`,{apiKey: process.env.NIBSS_API_KEY,apiSecret: process.env.NIBSS_API_SECRET});
    nibssToken = response.data.token;
    tokenExpiry = Date.now() + (55 * 60 * 1000);
    return nibssToken;
};

const createBVN = async (data) =>{
    const token = await getNibssToken();
    const response = await axios.post(`${process.env.NIBSS_BASE_URL}/api/insertBvn`, data,{ headers: { Authorization: `Bearer ${token}` }})
    return response.data;
};

const createNIN = async(data) =>{
    const token = await getNibssToken();
    const response = await axios.post(`${process.env.NIBSS_BASE_URL}/api/insertnin`, data,{ headers: { Authorization: `Bearer ${token}` }})
    return response.data
};

const validateBVN = async(bvn)=>{
    const token = await getNibssToken();
    const response = await axios.post(`${process.env.NIBSS_BASE_URL}/api/validateBvn`,  {bvn} ,{ headers: { Authorization: `Bearer ${token}` }})
    return response.data;
};
const validateNIN = async(nin)=>{
    const token = await getNibssToken();
    const response = await axios.post(`${process.env.NIBSS_BASE_URL}/api/validateNin`, {nin} ,{ headers: { Authorization: `Bearer ${token}` }})
    return response.data;
}

const createAccount = async(data) => {
    const token = await getNibssToken();
    const response = await axios.post(`${process.env.NIBSS_BASE_URL}/api/account/create`, data,{ headers: { Authorization: `Bearer ${token}` }})
    return response.data;
};

const nameEnquiry = async(accountNumber) =>{
    const token = await getNibssToken();
    const response = await axios.get(`${process.env.NIBSS_BASE_URL}/api/account/name-enquiry/${accountNumber}`,{ headers: { Authorization: `Bearer ${token}` }});
    return response.data
};
const transfer = async(data) => {
    const token = await getNibssToken();
    const response = await axios.post(`${process.env.NIBSS_BASE_URL}/api/transfer`, data,{ headers: { Authorization: `Bearer ${token}` }})
    return response.data;
}
const getBalance = async (accountNumber)=>{
    const token = await getNibssToken();
    const response = await axios.get(`${process.env.NIBSS_BASE_URL}/api/account/balance/${accountNumber}`,{ headers: { Authorization: `Bearer ${token}` }});
    return response.data;
}
const getTransaction = async(transactionId)=>{
    const token = await getNibssToken();
    const response = await axios.get(`${process.env.NIBSS_BASE_URL}/api/transaction/${transactionId}`,{ headers: { Authorization: `Bearer ${token}` }});
    return response.data;
}
const getAllAccounts = async()=>{
    const token = await getNibssToken();
    const response = await axios.get(`${process.env.NIBSS_BASE_URL}/api/accounts/`,{ headers: { Authorization: `Bearer ${token}` }});
    return response.data;
};


module.exports = {createBVN,createNIN,validateBVN,validateNIN,createAccount, nameEnquiry,transfer,getBalance,getTransaction,getAllAccounts};

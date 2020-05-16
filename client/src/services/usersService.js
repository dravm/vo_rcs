import axios from 'axios';

export default {
  getAll: async () => {
    let res = await axios.get(`/users/`);
    console.log(res.data)
    return res.data || [];
  }
}
export default {

  get (key: string) {
    return localStorage.getItem(key);
  },

  set (key: string, data: string) {
    localStorage.setItem(key, data);
  },

  remove (key: string) {
    localStorage.removeItem(key);
  }
};

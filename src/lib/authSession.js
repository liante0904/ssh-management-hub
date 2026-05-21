export function persistAuthSession({ user, accessToken }) {
  localStorage.setItem('mh_token', accessToken);
  localStorage.setItem('mh_user', JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem('mh_token');
  localStorage.removeItem('mh_user');
}

export function getSession() {
  try {
    const token = localStorage.getItem('mh_token');
    const user = JSON.parse(localStorage.getItem('mh_user') || 'null');
    return { token, user, loggedIn: !!token };
  } catch { return { token: null, user: null, loggedIn: false }; }
}

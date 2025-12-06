/* scripts/login.js */
document.getElementById('loginBtn').addEventListener('click', login);
async function login(){
  const email = document.getElementById('email').value.trim();
  const pass = document.getElementById('password').value.trim();
  const db = POSDB.loadDB();
  const user = db.users.find(u=>u.email.toLowerCase()===email.toLowerCase() && u.pass===pass);
  if(!user){ alert('Wrong Email or Password!'); return; }
  // store session
  localStorage.setItem('pos_user', JSON.stringify({id:user.id,email:user.email,role:user.role}));
  // for admin go to admin page else cashier
  if(user.role==='admin') window.location.href='admin.html'; else window.location.href='index.html';
}

import React from 'react'
import './login.css'
import { Link } from 'react-router-dom';
const Login = () => {
  return (
    <div>	<div className="container">
		<div className="forms-container">
			<div className="signin-signup">
				<form action="#" className="sign-in-form">
					<h2 className="title">Sign in</h2>
					<div className="input-field">
						<i className="fas fa-envelope"></i>
						<input type="email" placeholder="E-mail" />
					</div>
					<div className="input-field">
						<i className="fas fa-lock"></i>
						<input type="password" placeholder="Password" />
					</div>
					<input type="submit" value="Login" className="btn solid" />
					<p className="social-text">Or Sign in with social platforms</p>
					
<button type="button" className="login-with-google-btn" >
	Sign in with Google
  </button>
				</form>
				<form action="#" className="sign-up-form">
					<h2 className="title">Sign up</h2>
					<div className="input-field">
						<i className="fas fa-user"></i>
						<input type="text" placeholder="Full Name" required />
					  </div>
					<div className="input-field">
						<i className="fas fa-id-badge"></i>
						<input type="text" placeholder="Roll ID (b52XXXX)" id="roll-id-sign-up" pattern="b52[0-9]{4}" title="Roll ID should be in the format b52XXXX" required />
					  </div>
					  <div className="input-field">
						<i className="fas fa-envelope"></i>
						<input type="email" placeholder="Email" required />
					  </div>
					  <div className="input-field">
						<i className="fas fa-lock"></i>
						<input type="password" placeholder="Password" required />
					  </div>
			
					<input type="submit" className="btn" value="Sign up" />
					<p className="social-text">Or Sign up with social platforms</p>
					<button type="button" className="login-with-google-btn" >
						Sign up with Google
					  </button>
				</form>
			</div>
		</div>

		<div className="panels-container">
			<div className="panel left-panel">
				<div className="content">
					<h3>Welcome to CE Bootcamp!!!</h3>
					<p>
						Lorem ipsum dolor sit amet consectetur, adipisicing elit. Libero, blanditiis.
					</p>
					<button className="btn transparent" id="sign-up-btn">
						Sign up
					</button>
				</div>
				<img  src="https://i.ibb.co/6HXL6q1/Privacy-policy-rafiki.png" className="image" alt="" />
			</div>
			<div className="panel right-panel">
				<div className="content">
					<h3>Welcome to CE Bootcamp!!!.</h3>
					<p>
						Thank you for being part of our community. Your presence enriches our
          shared experiences. Let's continue this journey together!
					</p>
					<button className="btn transparent" id="sign-in-btn">
						Sign in
					</button>
				</div>
				<img src="https://i.ibb.co/nP8H853/Mobile-login-rafiki.png"  className="image" alt="" />
			</div>
		</div>
	</div></div>
  )
}

export default Login
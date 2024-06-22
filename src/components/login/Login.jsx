import React from 'react'
import './login.css'
import { Link } from 'react-router-dom';
const Login = () => {
  return (
    <div>	<div class="container">
		<div class="forms-container">
			<div class="signin-signup">
				<form action="#" class="sign-in-form">
					<h2 class="title">Sign in</h2>
					<div class="input-field">
						<i class="fas fa-envelope"></i>
						<input type="email" placeholder="E-mail" />
					</div>
					<div class="input-field">
						<i class="fas fa-lock"></i>
						<input type="password" placeholder="Password" />
					</div>
					<input type="submit" value="Login" class="btn solid" />
					<p class="social-text">Or Sign in with social platforms</p>
					
<button type="button" class="login-with-google-btn" >
	Sign in with Google
  </button>
				</form>
				<form action="#" class="sign-up-form">
					<h2 class="title">Sign up</h2>
					<div class="input-field">
						<i class="fas fa-user"></i>
						<input type="text" placeholder="Full Name" required />
					  </div>
					<div class="input-field">
						<i class="fas fa-id-badge"></i>
						<input type="text" placeholder="Roll ID (b52XXXX)" id="roll-id-sign-up" pattern="b52[0-9]{4}" title="Roll ID should be in the format b52XXXX" required />
					  </div>
					  <div class="input-field">
						<i class="fas fa-envelope"></i>
						<input type="email" placeholder="Email" required />
					  </div>
					  <div class="input-field">
						<i class="fas fa-lock"></i>
						<input type="password" placeholder="Password" required />
					  </div>
			
					<input type="submit" class="btn" value="Sign up" />
					<p class="social-text">Or Sign up with social platforms</p>
					<button type="button" class="login-with-google-btn" >
						Sign up with Google
					  </button>
				</form>
			</div>
		</div>

		<div class="panels-container">
			<div class="panel left-panel">
				<div class="content">
					<h3>Welcome to CE Bootcamp!!!</h3>
					<p>
						Lorem ipsum dolor sit amet consectetur, adipisicing elit. Libero, blanditiis.
					</p>
					<button class="btn transparent" id="sign-up-btn">
						Sign up
					</button>
				</div>
				<img  src="https://i.ibb.co/6HXL6q1/Privacy-policy-rafiki.png" class="image" alt="" />
			</div>
			<div class="panel right-panel">
				<div class="content">
					<h3>Welcome to CE Bootcamp!!!.</h3>
					<p>
						Thank you for being part of our community. Your presence enriches our
          shared experiences. Let's continue this journey together!
					</p>
					<button class="btn transparent" id="sign-in-btn">
						Sign in
					</button>
				</div>
				<img src="https://i.ibb.co/nP8H853/Mobile-login-rafiki.png"  class="image" alt="" />
			</div>
		</div>
	</div></div>
  )
}

export default Login
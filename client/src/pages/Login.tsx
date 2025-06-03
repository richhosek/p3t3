import { useState, type FormEvent, type ChangeEvent } from "react";
import { useMutation } from "@apollo/client";
import { LOGIN_USER } from "../utils/mutations";
import "semantic-ui-css/semantic.min.css";
import "../styles/Loginstyle.css";
import Signup from "./Signup";
import { useNavigate } from "react-router-dom";

import Auth from "../utils/auth";

const Login = () => {
  const [formState, setFormState] = useState({ email: "", password: "" });
  const [login, { error,}] = useMutation(LOGIN_USER);
  // const [redirectToSignup, setRedirectToSignup] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  // const [shouldRedirect, setShouldRedirect] = useState(false);

  const navigate = useNavigate();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (event: FormEvent) => {
  event.preventDefault();
  try {
    const { data } = await login({ variables: { ...formState } });

    console.log("Login response:", data); 

    Auth.login(data.login.token); // Save token
    setIsSuccess(true); // only if login works
    navigate("/Home"); 
  } catch (e) {
    console.error("Login failed:", e);
  }

  setFormState({ email: "", password: "" });
};


  return (
    <>

        <div className="ui blue inverted segment">
          <div className="ui two column very relaxed stackable grid">
            <div className="column">
              <h4>Login</h4>
              <form onSubmit={handleFormSubmit} className="ui form succes">
                <div className="field">
                  <label>Email</label>
                  <div className="ui left icon input">
                    <input
                      placeholder="email"
                      name="email"
                      type="email"
                      value={formState.email}
                      onChange={handleChange}
                    />
                    <i className="envelope icon"></i>
                  </div>
                </div>
                <div className="field">
                  <label>Password</label>
                  <div className="ui left icon input">
                    <input
                      placeholder="******"
                      name="password"
                      type="password"
                      value={formState.password}
                      onChange={handleChange}
                    />
                    <i className="lock icon"></i>
                  </div>
                </div>
                {isSuccess && (
  <div className="ui success message">
    <div className="header">Form Completed</div>
    <p>Thank you for coming back!</p>
  </div>
)}
                <button type="submit" className="ui violet submit button">
                  Login
                </button>
              </form>

              {error && (
                <div className="ui negative message">
                  <div className="header">Login failed</div>
                  <p>{error.message}</p>
                </div>
              )}
            </div>
      <Signup />
          </div>
        </div>
    </>
  );
};

export default Login;
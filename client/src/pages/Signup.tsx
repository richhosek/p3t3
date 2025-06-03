import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { ADD_PROFILE } from '../utils/mutations';

import Auth from '../utils/auth';

const Signup = () => {
  const navigate = useNavigate();
  const [formState, setFormState] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
  });
  const [addProfile, {error}] = useMutation(ADD_PROFILE);

  // update state based on form input changes
  const handleChange = (event: ChangeEvent) => {
    const { name, value } = event.target as HTMLInputElement;

    setFormState({
      ...formState,
      [name]: value,
    });
  };

  // submit form
  const handleFormSubmit = async (event: FormEvent) => {
    event.preventDefault();
    console.log(formState);

    try {
      const { data } = await addProfile({
        variables: { input: { ...formState } },
      });

      Auth.login(data.addProfile.token);
      navigate('/home');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
            <div className="column">
          <h4>Sign Up</h4>
          <div >
                  <form onSubmit={handleFormSubmit} className="ui form success">
                   <div className="field">
                     <label>Name</label>
                    <div className="ui left icon input">
                    <input
                      placeholder="name"
                      name="name"
                      type="text"
                      value={formState.name}
                      onChange={handleChange}
                      />
                    <i className="address card outline icon"></i>
                    </div> 
                    </div>
                   <div className="field">
                     <label>Username</label>
                    <div className="ui left icon input">
                    <input
                      placeholder="username"
                      name="username"
                      type="text"
                      value={formState.username}
                      onChange={handleChange}
                      />
                    <i className="user icon"></i>
                    </div> 
                    </div>
                     <div className="field">
              <label>Email</label>
              <div className="ui left icon input">
                    <input
                      placeholder="Your email"
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

                      {error && (
    <div className="ui negative message">
      <div className="header">Signup failed</div>
      <p>{error.message}</p>
    </div>
  )}

  <button
    style={{ cursor: 'pointer' }}
    type="submit"
    className="ui violet submit button"
  >
    Submit
  </button>
</form>
          </div>
        </div>
    </>
  );
};

export default Signup;

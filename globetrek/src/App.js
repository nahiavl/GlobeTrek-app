import React from 'react';
import { Routes, Route, useParams, Outlet } from 'react-router-dom';
import { Container } from '@mui/material';
import Login from './routes/login';
import Register from './routes/register';
import NewPassword from './routes/new_password';
import Element from './routes/home';
import Place from './routes/place';
import Planning from './routes/planning';
import Planned from './routes/planned';
import Done from './routes/done';
import ErrorPage from './routes/error-page';

const allowedLanguages = ['en', 'es', 'eu', 'gal'];

function ValidateLanguage() {
  const { language } = useParams();

  if (!allowedLanguages.includes(language)) {
    return window.location.href = "/GlobeTrek/en/login";
  }

  return <Outlet />;
}

function App() {
  return (
    <div>
      <Container>
        <Routes>
        <Route path="/GlobeTrek/:language" element={<ValidateLanguage />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="new_password" element={<NewPassword />} />
          <Route path="new_password/:user_id" element={<NewPassword />} />
          <Route path="home" element={<Element />} />
          <Route path="home/:user_id" element={<Element />} />
          <Route path="planning/:user_id" element={<Planning />} />
          <Route path="planned/:user_id" element={<Planned />} />
          <Route path="done/:user_id" element={<Done />} />
          <Route path="place/:place_id" element={<Place />} />
        </Route>
          <Route path="/GlobeTrek/*" element={<ErrorPage />} />
        </Routes>
      </Container>
    </div>
  );
}

export default App;
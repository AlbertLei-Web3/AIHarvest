import React from 'react';
import { RouteObject } from 'react-router-dom';
import Home from './pages/Home';
import Farms from './pages/Farms';
import Staking from './pages/Staking';
import Swap from './pages/Swap';
import NotFound from './pages/NotFound';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/farms',
    element: <Farms />,
  },
  {
    path: '/staking',
    element: <Staking />,
  },
  {
    path: '/swap',
    element: <Swap />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

export const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/farms', label: 'Farms' },
  { path: '/staking', label: 'Staking' },
  { path: '/swap', label: 'Swap' },
]; 
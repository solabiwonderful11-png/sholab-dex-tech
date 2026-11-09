import { Route, Switch } from "wouter";
import Home from "./pages/Home";
import Admin from "./pages/admin/Admin";

// Accounts are off; see README › Security. Only add login/signup/protected
// routes after the user has enabled accounts (platform tool `enable_accounts`).
//
// Routes:
//   /        → the public one-page portfolio site
//   /sholab  → the content control panel (public by the owner's request)
export default function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sholab" component={Admin} />
      <Route>{() => <div className="p-8">Not found</div>}</Route>
    </Switch>
  );
}

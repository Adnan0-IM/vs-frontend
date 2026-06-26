import Home from "@/features/home"
import SignUp from "@/features/auth/SignUp"
import SignIn from "@/features/auth/SignIn"
import Administration from "@/features/admin/administration"
import Verification from "@/features/user/verification"
import { BrowserRouter as Router, Routes, Route } from "react-router"

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route index element={<Home />} />
        <Route path="/auth" >
          <Route path="sign-in" element={<SignIn />} />
          <Route path="sign-up" element={<SignUp />} />
        </Route>
        <Route path="/verification" element={<Verification />} />
        <Route path="/administation" element={<Administration />} />
      </Routes>
    </Router>
  )
}

export default AppRouter

import { AuthProvider } from "./pages/Context/AuthContext";
import RestaurantAppRouter from "../src/Router/ResturantAppRouter";

function App() {
  return (
    <AuthProvider>
      <RestaurantAppRouter />
    </AuthProvider>
  );
}
export default App;

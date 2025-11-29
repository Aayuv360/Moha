import { Routes, Route } from "react-router-dom";
import { HomePage, ProductsPage, ProductDetailPage, CartPage, CheckoutPage, LoginPage, RegisterPage, OrdersPage, WishlistPage } from "@/features/user/pages";
import { UserLayout } from "@/features/user/layouts/UserLayout";
import NotFound from "@/pages/not-found";

export function UserRoutes() {
  return (
    <UserLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </UserLayout>
  );
}

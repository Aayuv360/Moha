export function UserFooter() {
  return (
    <footer className="bg-card border-t border-border py-8 md:py-12 px-4 md:px-6 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/products" className="hover:text-foreground">All Products</a></li>
              <li><a href="/products" className="hover:text-foreground">New Arrivals</a></li>
              <li><a href="/products" className="hover:text-foreground">Sale</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Help</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Contact Us</a></li>
              <li><a href="#" className="hover:text-foreground">Shipping Info</a></li>
              <li><a href="#" className="hover:text-foreground">Returns</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">About</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">About Us</a></li>
              <li><a href="#" className="hover:text-foreground">Blog</a></li>
              <li><a href="#" className="hover:text-foreground">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Privacy</a></li>
              <li><a href="#" className="hover:text-foreground">Terms</a></li>
              <li><a href="#" className="hover:text-foreground">Cookies</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Moha. Celebrating India's textile heritage.
          </p>
        </div>
      </div>
    </footer>
  );
}

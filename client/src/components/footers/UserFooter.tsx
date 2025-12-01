export function UserFooter() {
  return (
    <footer className="bg-card border-t border-border py-6 sm:py-8 md:py-12 px-3 sm:px-4 md:px-6 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
          <div>
            <h4 className="font-semibold mb-2 sm:mb-4 text-xs sm:text-sm md:text-base">Shop</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li><a href="/products" className="hover:text-foreground transition-colors">All Products</a></li>
              <li><a href="/products" className="hover:text-foreground transition-colors">New Arrivals</a></li>
              <li><a href="/products" className="hover:text-foreground transition-colors">Sale</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2 sm:mb-4 text-xs sm:text-sm md:text-base">Help</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Shipping Info</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Returns</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2 sm:mb-4 text-xs sm:text-sm md:text-base">About</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2 sm:mb-4 text-xs sm:text-sm md:text-base">Legal</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-4 sm:pt-6 md:pt-8 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">
            © 2024 Moha. Celebrating India's textile heritage.
          </p>
        </div>
      </div>
    </footer>
  );
}

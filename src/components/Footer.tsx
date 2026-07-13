const Footer = () => {
  return (
    <footer className=" py-4 text-muted-foreground">
      <p className="text-xs text-center">
        &copy; {new Date().getFullYear()} VeriDoc.
        All rights reserved.
      </p>
    </footer>
  )
}

export default Footer

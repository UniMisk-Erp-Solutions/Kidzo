import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CreateBook = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/books/templates", { replace: true });
  }, [navigate]);
  return null;
};

export default CreateBook;

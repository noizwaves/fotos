import { createContext, useState } from "react";

export const CheckedContext = createContext();

export const CheckedProvider = ({ children }) => {
  const [checked, setChecked] = useState([]);

  const toggleChecked = (photo) => {
    if (checked.indexOf(photo) >= 0) {
      setChecked(checked.filter((p) => p !== photo));
    } else {
      setChecked([...checked, photo]);
    }
  };

  const isChecked = (photo) => {
    return checked.indexOf(photo) >= 0;
  };

  const anyChecked = () => {
    return checked.length > 0;
  };

  const resetChecked = () => {
    setChecked([]);
  };

  return (
    <CheckedContext.Provider
      value={{ anyChecked, isChecked, toggleChecked, checked, resetChecked }}
    >
      {children}
    </CheckedContext.Provider>
  );
};

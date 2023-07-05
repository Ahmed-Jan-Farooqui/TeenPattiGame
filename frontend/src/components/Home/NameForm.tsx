import React from "react";
import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

interface nameFormType {
  setName: React.Dispatch<React.SetStateAction<string>>;
  socket: Socket<DefaultEventsMap, DefaultEventsMap>;
}

const NameForm = (props: nameFormType) => {
  const [localName, setLocalName] = React.useState("");
  const handleChange = (event: any) => {
    setLocalName(event.target.value);
  };

  const modifyGlobalName = (event: any) => {
    event.preventDefault();
    props.setName(localName);
    props.socket.emit("Player Init", localName);
  };

  return (
    <div className="name-container">
      <form onSubmit={modifyGlobalName} className="NameForm">
        <p className="name-text">
          If you'd like a game of Teen Patti, enter your name below!
        </p>
        <p>Please open all four tabs before you begin entering names.</p>
        <input
          value={localName}
          onChange={handleChange}
          placeholder="Please enter your name..."
          className="name"
        ></input>
        <button type="submit" className="submit-name">
          Submit
        </button>
      </form>
    </div>
  );
};

export default NameForm;

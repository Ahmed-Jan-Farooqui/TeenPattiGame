interface MessagesContainerType {
  current_player_name: string;
  server_move_message: string;
  take_pile_handler: any;
}

const MessageContainer = (props: MessagesContainerType) => {
  let server_game_message = `It is ${props.current_player_name}'s turn...`;
  return (
    <div className="message-box">
      <div className="message-content-container">
        {props.server_move_message}
      </div>
      <div className="message-content-container">{server_game_message}</div>
      <div className="take-pile-button-container">
        <button className="take-pile-button" onClick={props.take_pile_handler}>
          Take Pile
        </button>
      </div>
    </div>
  );
};

export default MessageContainer;

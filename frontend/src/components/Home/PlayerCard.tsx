interface card {
  suit: string;
  rank: string;
  clickHandler: any;
}

const PlayerCard = (props: card) => {
  if (props.suit === "hearts") {
    return (
      <a
        onClick={() => {
          props.clickHandler(props.rank, props.suit);
        }}
        className={`card rank-${props.rank} ${props.suit}`}
      >
        <span className="rank">{props.rank}</span>
        <span className="suit">&hearts;</span>
      </a>
    );
  }
  if (props.suit === "diams") {
    return (
      <a
        onClick={() => {
          props.clickHandler(props.rank, props.suit);
        }}
        className={`card rank-${props.rank} ${props.suit}`}
      >
        <span className="rank">{props.rank}</span>
        <span className="suit">&diams;</span>
      </a>
    );
  }
  if (props.suit === "clubs") {
    return (
      <a
        onClick={() => {
          props.clickHandler(props.rank, props.suit);
        }}
        className={`card rank-${props.rank} ${props.suit}`}
      >
        <span className="rank">{props.rank}</span>
        <span className="suit">&clubs;</span>
      </a>
    );
  }
  if (props.suit === "spades") {
    return (
      <a
        onClick={() => {
          props.clickHandler(props.rank, props.suit);
        }}
        className={`card rank-${props.rank} ${props.suit}`}
      >
        <span className="rank">{props.rank}</span>
        <span className="suit">&spades;</span>
      </a>
    );
  }
  return (
    <a
      onClick={() => {
        props.clickHandler(props.rank, props.suit);
      }}
      className={`card rank-${props.rank} ${props.suit}`}
    >
      <div className="card back">*</div>
    </a>
  );
};

export default PlayerCard;

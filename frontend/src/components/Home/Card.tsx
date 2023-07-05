interface card {
  suit: string;
  rank: string;
}

const Card = (props: card) => {
  if (props.suit === "spades") {
    return (
      <div className={`card rank-${props.rank} ${props.suit}`}>
        <span className="rank">{props.rank}</span>
        <span className="suit">&spades;</span>
      </div>
    );
  }
  if (props.suit === "hearts") {
    return (
      <div className={`card rank-${props.rank} ${props.suit}`}>
        <span className="rank">{props.rank}</span>
        <span className="suit">&hearts;</span>
      </div>
    );
  }
  if (props.suit === "clubs") {
    return (
      <div className={`card rank-${props.rank} ${props.suit}`}>
        <span className="rank">{props.rank}</span>
        <span className="suit">&clubs;</span>
      </div>
    );
  }
  if (props.suit === "diams") {
    return (
      <div className={`card rank-${props.rank} ${props.suit}`}>
        <span className="rank">{props.rank}</span>
        <span className="suit">&diams;</span>
      </div>
    );
  }
  return <div className="card back">*</div>;
};

export default Card;

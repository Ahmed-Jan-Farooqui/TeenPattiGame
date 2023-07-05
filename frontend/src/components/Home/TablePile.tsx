import Card from "./Card";

interface TablePileType {
  cards: {
    rank: string;
    suit: string;
  }[];
}

const TablePile = (props: TablePileType) => {
  let displayElements = props.cards.map((card, index) => {
    return (
      <li>
        <Card rank={card.rank} suit={card.suit} />
      </li>
    );
  });
  return (
    <div className="card-area">
      <ul className="hand remove-margin">{displayElements}</ul>
    </div>
  );
};

export default TablePile;

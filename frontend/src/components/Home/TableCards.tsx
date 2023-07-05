import Card from "./Card";

interface TableCardsType {
  cards: { rank: string; suit: string }[];
  playerNumber: string;
}

const TableCards = (props: TableCardsType) => {
  let card_elements = [];
  // for (let i = 0; i < 3; i++) {
  //   card_elements.push(
  //     <li>
  //       <Card rank="null" suit="null" />
  //     </li>
  //   );
  // }
  for (let i = 0; i < props.cards.length; i++) {
    card_elements.push(
      <li>
        <Card rank={props.cards[i].rank} suit={props.cards[i].suit} />
      </li>
    );
  }
  return (
    <ul className={`hand remove-margin ${props.playerNumber}-cards`}>
      {card_elements}
    </ul>
  );
};

export default TableCards;

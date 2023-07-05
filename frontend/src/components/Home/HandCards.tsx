import PlayerCard from "./PlayerCard";

interface HandCardsType {
  cards: { rank: string; suit: string }[];
  clickHandler: any;
}

const HandCards = (props: HandCardsType) => {
  let displayElements = props.cards.map((card, index) => {
    return (
      <li>
        <PlayerCard
          rank={card.rank}
          suit={card.suit}
          clickHandler={props.clickHandler}
        />
      </li>
    );
  });
  return <ul className="hand remove-margin">{displayElements}</ul>;
};

export default HandCards;

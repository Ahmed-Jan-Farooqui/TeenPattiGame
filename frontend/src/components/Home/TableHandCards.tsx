import PlayerCard from "./PlayerCard";

interface TableHandCardsType {
  face_up: { rank: string; suit: string }[];
  face_down: { rank: string; suit: string }[];
  clickHandler: any;
}

const TableHandCards = (props: TableHandCardsType) => {
  let displayElements = [];
  for (let i = 0; i < props.face_down.length; i++) {
    displayElements.push(
      <li>
        <PlayerCard rank="null" suit="null" clickHandler={props.clickHandler} />
      </li>
    );
  }
  for (let i = 0; i < props.face_up.length; i++) {
    displayElements.push(
      <li>
        <PlayerCard
          rank={props.face_up[i].rank}
          suit={props.face_up[i].suit}
          clickHandler={props.clickHandler}
        />
      </li>
    );
  }
  return <ul className="hand remove-margin">{displayElements}</ul>;
};

export default TableHandCards;

import { BigInt, Bytes, Address } from '@graphprotocol/graph-ts';
import {
  Contract,
  Deposited,
  Jackpot as JackpotEvent,
  Rewarded,
  Withdrawn
} from '../generated/Contract/Contract';
import { User, Round, Jackpot } from '../generated/schema';

function deposit(userAddress: Address, amount: BigInt): void {
  let user = User.load(userAddress.toHex());
  if (user == null) {
    user = new User(userAddress.toHex());
    user.amount = BigInt.fromI32(0);
  }
  user.amount = user.amount.plus(amount);
  user.save();
}

export function handleDeposited(event: Deposited): void {
  deposit(event.params.user, event.params.amount);
}

export function handleWithdrawn(event: Withdrawn): void {
  let user = User.load(event.params.user.toHex());
  user.amount = user.amount.minus(event.params.amount);
  user.save();
}

export function handleJackpot(event: JackpotEvent): void {
  let jackpot = new Jackpot(event.params.roundId.toString());
  jackpot.round = event.params.roundId.toString();
  jackpot.winner = event.params.winner;
  jackpot.prize = event.params.prize;
  jackpot.save();
  deposit(event.params.winner, event.params.prize);
}

export function handleRewarded(event: Rewarded): void {
  let winners = new Array<Address>(3);
  let prizes = new Array<BigInt>(3);
  winners = event.params.winners;
  prizes = event.params.prizes;

  let winnersInBytes = new Array<Bytes>(0);
  for(let i = 0; i < winners.length; i++) {
    deposit(winners[i], prizes[i]);
    winnersInBytes.push(winners[i]);
  }
  deposit(event.params.executor, event.params.executorReward);

  let round = new Round(event.params.roundId.toString());
  round.blockNumber = event.block.number;
  round.timestamp = event.block.timestamp;
  round.winners = winnersInBytes;
  round.prizes = prizes;
  round.roundCloser = event.params.executor;
  round.roundCloserReward = event.params.executorReward;
  round.jackpot = event.params.roundId.toString();
  round.save();
}

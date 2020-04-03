import { BigInt, Bytes, Address } from '@graphprotocol/graph-ts';
import {
  Contract,
  Deposited,
  Jackpot,
  Rewarded,
  Withdrawn
} from '../generated/Contract/Contract';
import { User, Round } from '../generated/schema';

export function handleDeposited(event: Deposited): void {
  let user = User.load(event.params.user.toHex());
  if (user == null) {
    user = new User(event.params.user.toHex());
    user.amount = BigInt.fromI32(0);
  }
  user.amount = user.amount.plus(event.params.amount);
  user.save();
}

export function handleWithdrawn(event: Withdrawn): void {
  let user = User.load(event.params.user.toHex());
  user.amount = user.amount.minus(event.params.amount);
  user.save();
}

export function handleJackpot(event: Jackpot): void {
  let user = User.load(event.params.winner.toHex());
  user.amount = user.amount.plus(event.params.prize);
  user.save();
}

export function handleRewarded(event: Rewarded): void {
  let winners = new Array<Address>(3);
  let prizes = new Array<BigInt>(3);
  winners = event.params.winners;
  prizes = event.params.prizes;

  let winnersInBytes = new Array<Bytes>(0);
  for(let i = 0; i < winners.length; i++) {
    let user = User.load(winners[i].toHex());
    user.amount = user.amount.plus(prizes[i]);
    user.save();
    winnersInBytes.push(winners[i]);
  }

  let executor = User.load(event.params.executor.toHex());
  executor.amount = executor.amount.plus(event.params.executorReward);
  executor.save();

  let round = new Round(event.params.roundId.toString());
  round.blockNumber = event.block.number;
  round.timestamp = event.block.timestamp;
  round.winners = winnersInBytes;
  round.prizes = prizes;
  round.roundCloser = event.params.executor;
  round.roundCloserReward = event.params.executorReward;
  round.save();  
}

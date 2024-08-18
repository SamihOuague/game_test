import random
import json

color = ["H", "D", "C", "S"]
value = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]


final_len = len(value) * len(color)
cards = [(value[x % 13], color[x % 4]) for x in range(final_len)]
random.shuffle(cards)
flop = random.sample(cards, 15)
print(json.dumps(flop))
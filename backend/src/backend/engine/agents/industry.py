from mesa import Agent


class IndustryAgent(Agent):

    def __init__(self, model, starting_price: float = 0.0):
        super().__init__(model)
        self.starting_price = starting_price

    def step(self):
        # behavior of industry in each step
        pass

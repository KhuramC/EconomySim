from mesa import Agent


class PersonAgent(Agent):

    def __init__(self, model, income: float = 0.0):
        super().__init__(model)
        self.income = income

    def step(self):
        # behavior of person in each step
        self.income = self.income + 1.0

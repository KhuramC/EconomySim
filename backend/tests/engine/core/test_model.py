import pytest
from pytest import mark
from contextlib import nullcontext
from backend.engine.types.IndustryType import IndustryType


@mark.parametrize(
    "delete_values,exception",
    [
        pytest.param(False, nullcontext(), id="valid"),
        pytest.param(True, pytest.raises(ValueError), id="invalid"),
    ],
)
def test_validate_taxes(model, tax_rates, delete_values, exception):
    taxing_rates = tax_rates.copy()
    if delete_values:
        del taxing_rates["corporate_income_tax"]
    with exception:
        model.validate_taxes(taxing_rates)


@pytest.mark.parametrize("industry_type", list(IndustryType))
def test_get_employees(model, industry_type: IndustryType):
    assert len(model.get_employees(industry_type)) == 0
    # TODO: redo this whenever starting unemployment logic changes


@mark.xfail(reason="Testing for the step function has not been considered quite yet.")
def test_step():
    assert False

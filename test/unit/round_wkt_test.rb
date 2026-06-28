require_relative '../test_helper'

class RoundWktTest < ActiveSupport::TestCase

  test 'rounds coordinates to the given precision' do
    assert_equal 'POINT (135.501235 34.701235)',
      RedmineGtt.round_wkt('POINT (135.50123456789123 34.701234567891234)', 6)
  end

  test 'rounds negative coordinates' do
    assert_equal 'POINT (-135.501235 -34.701235)',
      RedmineGtt.round_wkt('POINT (-135.50123456789123 -34.701234567891234)', 6)
  end

  test 'never renders negative zero' do
    assert_equal 'POINT (0.0 0)',
      RedmineGtt.round_wkt('POINT (-0.0000001 0)', 6)
  end

  test 'precision zero keeps a plain decimal (no scientific notation, no crash)' do
    assert_equal 'POINT (135.0 35.0)',
      RedmineGtt.round_wkt('POINT (135.4 34.6)', 0)
  end

  test 'drops trailing zeros' do
    assert_equal 'POINT (135.61 34.7)',
      RedmineGtt.round_wkt('POINT (135.610000 34.700000)', 6)
  end

  test 'rounds every coordinate and leaves integer tokens untouched' do
    assert_equal 'LINESTRING (1.235 2.0, 3.5 4.556)',
      RedmineGtt.round_wkt('LINESTRING (1.234567 2.0, 3.5 4.555555)', 3)
  end

  test 'returns non-string input unchanged' do
    assert_nil RedmineGtt.round_wkt(nil, 6)
  end

end

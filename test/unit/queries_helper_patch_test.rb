require_relative '../test_helper'

class QueriesHelperPatchTest < Redmine::HelperTest
  include QueriesHelper
  include ApplicationHelper
  include ERB::Util

  teardown do
    Setting.plugin_redmine_gtt = Setting.plugin_redmine_gtt.merge(
      'distance_unit' => 'm'
    )
  end

  def distance_column
    IssueQuery.new.available_columns.detect { |c| c.name == :distance }
  end

  test 'renders the distance column in the configured unit' do
    Setting.plugin_redmine_gtt = Setting.plugin_redmine_gtt.merge(
      'distance_unit' => 'km'
    )
    assert_equal '1.50', column_value(distance_column, nil, 1500.0)
  end

  test 'renders meters by default' do
    assert_equal '1500.00', column_value(distance_column, nil, 1500.0)
  end

  test 'renders the csv value with the locale decimal separator' do
    Setting.plugin_redmine_gtt = Setting.plugin_redmine_gtt.merge(
      'distance_unit' => 'km'
    )
    assert_equal '1.50', csv_value(distance_column, nil, 1500.0)
  end

  test 'leaves blank distance values to core' do
    assert_equal '', column_value(distance_column, nil, nil).to_s
  end
end

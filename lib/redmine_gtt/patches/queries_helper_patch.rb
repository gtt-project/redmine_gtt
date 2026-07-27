module RedmineGtt
  module Patches

    # Renders the distance column in the configured display unit (#10).
    # The underlying value stays meters (it is what the query selects and
    # what the REST API returns); only the rendered list/CSV cell converts.
    module QueriesHelperPatch

      def self.apply
        QueriesHelper.prepend self unless QueriesHelper < self
      end

      def column_value(column, item, value)
        if column.name == :distance && value.present?
          gtt_format_distance(value)
        else
          super
        end
      end

      def csv_value(column, object, value)
        if column.name == :distance && value.present?
          # mirror core's CSV float formatting incl. the decimal separator
          gtt_format_distance(value).gsub('.', l(:general_csv_decimal_separator))
        else
          super
        end
      end

      private

      def gtt_format_distance(meters)
        sprintf('%.2f', RedmineGtt::DistanceUnit.from_meters(meters))
      end

    end
  end
end

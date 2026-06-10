# frozen_string_literal: true

module RedmineGtt
  module Patches
    module IssueQueryPatch

      def self.apply
        unless IssueQuery < self
          IssueQuery.prepend self
        end
      end

      def self.prepended(base)
      end

      def issues(*_)
        super.tap do |issues|
          if load_geojson? || has_column?(:geom)
            Issue.load_geojson(issues)
          end
          if center = find_center_point
            load_distances(issues, center)
          end
        end
      rescue ::ActiveRecord::StatementInvalid => e
        raise ::Query::StatementInvalid.new(e.message)
      end

      def load_geojson
        @load_geojson = true
      end
      def load_geojson?
        !!@load_geojson
      end

      def available_columns
        return @available_columns if @available_columns

        super.tap do |columns|

          if project.nil? or project.module_enabled?('gtt')
            columns << QueryColumn.new(:geom,
              caption: :field_geom
            )
            columns << QueryColumn.new(:distance,
              caption: :label_gtt_distance,
              sortable: lambda{
                lng, lat = find_center_point
                distance_query lng, lat
              }
            )
          end

        end
      end


      def initialize_available_filters()
        super
        if project and project.module_enabled?('gtt')
          add_available_filter(
            'bbox',
            name: l(:label_gtt_bbox_filter),
            type: :list,
            values: [['On map', '']]
          )
          add_available_filter(
            'distance',
            name: l(:label_gtt_distance),
            type: :float,
          )
        end
      end


      # Comparison operators accepted for the distance filter besides the
      # specially handled *, !* and ><. Anything else must not end up in SQL.
      DISTANCE_OPERATORS = %w(= >= <= > <).freeze

      def sql_for_distance_field(field, operator, value)
        case operator
        when '*'
          "#{Issue.table_name}.geom IS NOT NULL"
        when '!*'
          "#{Issue.table_name}.geom IS NULL"
        when '><'
          # value has to be ['meters_min', 'meters_max', 'lng', 'lat']
          lng, lat = value.last(2).map(&:to_f)
          Issue.send(:sanitize_sql_array, [
            "#{distance_query(lng, lat)} BETWEEN ? AND ?",
            value.first.to_i, value[1].to_i
          ])
        when *DISTANCE_OPERATORS
          # value has to be ['meters', 'lng', 'lat']
          lng, lat = value.last(2).map(&:to_f)
          Issue.send(:sanitize_sql_array, [
            "#{distance_query(lng, lat)} #{operator} ?",
            value.first.to_i
          ])
        else
          raise ::Query::StatementInvalid, "Unknown distance operator #{operator}"
        end
      end


      def sql_for_bbox_field(field, operator, value)
        not_in = "not " if operator == '!'

        # value should be ['lng1|lat1|lng2|lat2'] or 'lng1|lat1|lng2|lat2' or
        # ['lng1','lat1','lng2','lat2']
        if value.is_a?(Array) && value.size == 1
          value = value.first
        end

        if value.is_a?(String)
          value = value.split('|')
        end

        lng1, lat1, lng2, lat2 = value.map(&:to_f)

        # ST_Intersects (rather than envelope containment) also matches
        # geometries that are not simple points.
        envelope = Issue.send(:sanitize_sql_array, [
          "ST_MakeEnvelope(?, ?, ?, ?, 4326)", lng1, lat1, lng2, lat2
        ])
        "#{not_in} ST_Intersects(#{Issue.table_name}.geom, #{envelope})"
      end

      private

      def find_center_point
        if v = values_for('distance') and v.size > 2
          v.last(2).map(&:to_f)
        end
      end

      def distance_query(lng, lat)
        # ST_MakePoint instead of ST_GeomFromText: no textual geometry to
        # assemble, the coordinates bind as plain numeric parameters.
        Arel.sql(Issue.send(:sanitize_sql_array, [
          "ST_DistanceSphere(#{Issue.table_name}.geom, ST_SetSRID(ST_MakePoint(?, ?), 4326))",
          lng.to_f, lat.to_f
        ]))
      end

      def load_distances(issues, center_point)
        lng, lat = center_point
        distances = Hash[
          Issue.
            where(id: issues.map(&:id)).
            pluck(:id, distance_query(lng, lat))
        ]
        issues.each{|i| i.instance_variable_set :@distance, distances[i.id]}
      end

    end
  end
end

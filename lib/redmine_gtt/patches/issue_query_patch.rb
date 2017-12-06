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
          if center = find_center_point
            load_distances(issues, center)
          end
        end
      rescue ::ActiveRecord::StatementInvalid => e
        raise ::Query::StatementInvalid.new(e.message)
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


      # weiter: use 'On map' option tag to hold current map extent
      # - wenn filter hinzugefügt befüllen (dom hook oder so?)
      # - on map move / zoom updaten (app.map.js)
      def initialize_available_filters()
        super
        if project and project.module_enabled?('gtt')
          add_available_filter(
            'bbox',
            name: l(:label_gtt_bbox_filter),
            type: :list,
            values: ['On map']
          )
          add_available_filter(
            'distance',
            name: l(:label_gtt_distance),
            type: :float,
          )
        end
      end


      def sql_for_distance_field(field, operator, value)
        case operator
        when '*'
          "#{Issue.table_name}.geom IS NOT NULL"
        when '!*'
          "#{Issue.table_name}.geom IS NULL"
        else
          # value has to be ['meters_min', 'lng', 'lat']
          # or ['meters_min', 'meters_max', 'lng', 'lat'] if op == '><'
          lng, lat = value.last(2).map(&:to_f)
          distance = value.first.to_i
          sql = "ST_Distance_Sphere(#{Issue.table_name}.geom, ST_GeomFromText('POINT(#{lng} #{lat})',4326))"
          if operator == '><'
            distance_max = value[1].to_i
            sql << " BETWEEN #{distance} AND #{distance_max}"
          else
            sql << " #{operator} #{distance}"
          end
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

        # sanitize the coordinate values:
        lng1,lat1,lng2,lat2 = value.map(&:to_f)

        # TODO
        # First I tried this, but it continued to complain about mixing
        # different SRIDs:
        # coordinates = [
        #  [lng1,lat1], [lng2,lat1], [lng2,lat2], [lng1,lat2]
        # ].map{|a| a.join ' '}.join(',')
        # box = "ST_Polygon(ST_GeomFromText('LINESTRING(#{coordinates})'), 4326)"
        # "#{not_in}ST_Contains(#{box}, ST_SetSRID(#{db_table}.geom, 4326))"

        # So instead, I came up with this:
        "#{not_in}ST_MakeEnvelope(#{lng1},#{lat1},#{lng2},#{lat2}, 4326) ~ #{Issue.table_name}.geom"
        # I am not sure about the implications of using ~ instead of one of
        # the ST_ functions. Appears that it is a  PostgreSQL geometric
        # operator, leading to casting the PostGIS values to a PostgreSQL
        # geometric type. Fact is, this statement does not seem to care
        # about the SRID (can even leave it out of the MakeEnvelope call).
        # Doesn't feel right but works for my simple test case and is
        # probably good enough for this simple case (bbox is a rectangle and
        # other geometry is a point). We should check if indizes are actually
        # used though.
      end

      private

      def find_center_point
        if v = values_for('distance') and v.size > 2
          v.last(2).map(&:to_f)
        end
      end

      def distance_query(lng, lat)
        "ST_Distance_Sphere(#{Issue.table_name}.geom, ST_GeomFromText('POINT(#{lng} #{lat})',4326))"
      end

      def load_distances(issues, center_point)
        lng, lat = center_point
        distances = Hash[
          Issue.
            where(id: issues.map(&:id)).
            pluck(:id, "#{distance_query(lng, lat)}")
        ]
        issues.each{|i| i.instance_variable_set :@distance, distances[i.id]}
      end

    end
  end
end

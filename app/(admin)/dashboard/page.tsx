'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

interface UserChartData {
  date: string;
  newUsers: number;
  totalUsers: number;
}

interface ChatMessageChartData {
  date: string;
  newChats: number;
  messages: number;
}

const userChartConfig = {
  newUsers: {
    label: 'New Users',
    color: 'hsl(var(--chart-1))',
  },
  totalUsers: {
    label: 'Total Users',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

const chatMessageChartConfig = {
  newChats: {
    label: 'New Chats',
    color: 'hsl(var(--chart-3))',
  },
  messages: {
    label: 'Messages',
    color: 'hsl(var(--chart-4))',
  },
} satisfies ChartConfig;

export default function Analytics() {
  const [userData, setUserData] = useState<UserChartData[]>([]);
  const [chatMessageData, setChatMessageData] = useState<ChatMessageChartData[]>([]);
  const [month, setMonth] = useState<string>('2025-04');
  const [activeUserChart, setActiveUserChart] = useState<keyof typeof userChartConfig>('newUsers');
  const [activeChatChart, setActiveChatChart] = useState<keyof typeof chatMessageChartConfig>('newChats');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const userResponse = await fetch(`/api/analytics/users?month=${month}`, {
        credentials: 'include',
      });
      if (!userResponse.ok) throw new Error('Failed to fetch user data');
      const userJson = await userResponse.json();
      setUserData(userJson.data);

      const chatResponse = await fetch('/api/analytics/chats-messages', {
        credentials: 'include',
      });
      if (!chatResponse.ok) throw new Error('Failed to fetch chat/message data');
      const chatJson = await chatResponse.json();
      setChatMessageData(chatJson.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchData();
    }, 300);
  }, [month]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMonth(e.target.value);
  };

  const userTotal = useMemo(
    () => ({
      newUsers: userData.reduce((acc, curr) => acc + curr.newUsers, 0),
      totalUsers: userData.length > 0 ? userData[userData.length - 1].totalUsers : 0,
    }),
    [userData]
  );

  const chatTotal = useMemo(
    () => ({
      newChats: chatMessageData.reduce((acc, curr) => acc + curr.newChats, 0),
      messages: chatMessageData.reduce((acc, curr) => acc + curr.messages, 0),
    }),
    [chatMessageData]
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b">
        <div className="flex items-center gap-2 px-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </div>
        <div className="ml-auto mr-4 flex items-center gap-2 pt-2">
          <Label htmlFor="month">Select Month</Label>
          <Input
            id="month"
            type="month"
            value={month}
            onChange={handleMonthChange}
            className="w-[150px]"
          />
        </div>
      </header>

      <div className="p-4 space-y-8">
        {/* User Chart */}

        <Card>
          <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
            <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
              <CardTitle>User Growth</CardTitle>
              <CardDescription>
                Showing user metrics for{' '}
                {new Date(month + '-01').toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </CardDescription>

            </div>
            <div className="flex">
              {(['newUsers', 'totalUsers'] as const).map((key) => (
                <button
                  key={key}
                  data-active={activeUserChart === key}
                  className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                  onClick={() => setActiveUserChart(key)}
                >
                  <span className="text-xs text-muted-foreground">{userChartConfig[key].label}</span>
                  <span className="text-lg font-bold leading-none sm:text-3xl">
                    {userTotal[key].toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:p-6">
            <ChartContainer config={userChartConfig} className="aspect-auto h-[250px] w-full">
              <BarChart
                accessibilityLayer
                data={userData}
                margin={{ left: 12, right: 12 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="w-[150px]"
                      nameKey="users"
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        });
                      }}
                    />
                  }
                />
                <Bar dataKey={activeUserChart} fill={`var(--color-${activeUserChart})`} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Chat/Message Chart */}
        <Card>
          <CardHeader className="flex flex-col items-stretch space-y-0 p-0 sm:flex-row">
            <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
              <CardTitle>Chat and Message Activity</CardTitle>
              <CardDescription>Last 3 days of activity</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:p-6">
            <ChartContainer config={chatMessageChartConfig} className="aspect-auto h-[250px] w-full">
              <BarChart
                accessibilityLayer
                data={chatMessageData}
                margin={{ left: 12, right: 12 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="w-[150px]"
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        });
                      }}
                    />
                  }
                />
                <Bar dataKey="newChats" fill="var(--color-newChats)" radius={4} />
                <Bar dataKey="messages" fill="var(--color-messages)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}